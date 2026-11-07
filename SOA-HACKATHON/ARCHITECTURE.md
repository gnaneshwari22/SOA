# Renewable Certificate Retirement System — Architecture Document
## SOA Programming and Microservices — Team 17

### 1. Executive Summary
The **Renewable Certificate Retirement System** is an enterprise-grade renewable energy certificate (REC) registry designed to solve the critical carbon accounting challenge of **double counting** and **duplicate claims**.

The central business rule enforced across the entire architecture is:
> **One certificate serial number can be successfully retired only once.**

Once a certificate has been retired, it must never be transferred or retired again.

---

### 2. Course Outcomes (CO) Alignment Matrix

| Course Outcome | Architectural Implementation | Verification Method |
| :--- | :--- | :--- |
| **CO1: SOA & Microservices Architecture** | Independent domain services (`Auth`, `Certificate`, `Ownership`, `Retirement`). Asynchronous event choreography via Apache Kafka topic `soa.s10.t17.events`. | REST API isolation, transactional outbox pattern, event deduplication. |
| **CO2: Security & Observability** | BCrypt password hashing, signed JWT tokens, role-based access control (`registryOfficer` vs `certificateOwner`), tenant isolation, Spring Boot Actuator, Micrometer metrics, structured audit logs. | Automated security rejection tests (401/403), audit trail inspection, actuator endpoints. |
| **CO3: Service Discovery & Database Isolation** | Netflix Eureka Server for dynamic registration, Spring Cloud Gateway for load-balanced routing (`lb://`), complete database isolation (dedicated PostgreSQL DB per service, 0 cross-DB queries). | Multi-instance failover test (stopping instance 2 maintains 100% uptime), independent schema inspection. |
| **CO4: Testing, DevOps & CI/CD** | JUnit 5, Mockito, AssertJ unit and JPA tests, concurrency race-condition testing, Dockerfiles, `docker-compose.yml`, and GitHub Actions CI/CD workflow. | Automated test runs (`mvn test`), concurrency test with 20 parallel hits, Docker compose verification. |

---

### 3. Microservices Topology

```
                              ┌────────────────────────────────────────┐
                              │  React 19 + TypeScript + Vite Client   │
                              └───────────────────┬────────────────────┘
                                                  │ HTTPS / REST (Bearer JWT)
                                                  ▼
                              ┌────────────────────────────────────────┐
                 ┌───────────►│   Spring Cloud API Gateway (Port 8080) │◄───────────┐
                 │            └───────────────────┬────────────────────┘            │
                 │                                │                                 │
     Service Registration                         │ Service Discovery (lb://)       │
                 │                                ▼                                 │
                 │            ┌────────────────────────────────────────┐            │
                 ├───────────►│    Netflix Eureka Server (Port 8761)   │◄───────────┤
                 │            └────────────────────────────────────────┘            │
                 │                                                                  │
      ┌──────────┴──────────┐       ┌──────────────────────┐       ┌────────────────┴─────┐
      │  Auth Service (8081)│       │Certificate Svc (8082)│       │Ownership Svc (8083)  │
      │  (auth_db :5432)    │       │(certificate_db :5433)│       │(ownership_db :5434)  │
      └─────────────────────┘       └───────────┬──────────┘       └──────────▲───────────┘
                                                │                             │
                                                │ Synchronous REST            │ Consumer: Lock
                                                ▼                             │ Ownership on Retire
                                     ┌──────────────────────┐                 │
                                     │Retirement Svc (8084) ├─────────────────┘
                                     │(retirement_db :5435) │
                                     └──────────┬───────────┘
                                                │
                                                │ Transactional Outbox
                                                ▼
                                     ┌───────────────────────────────────────────┐
                                     │ Apache Kafka Cluster (Broker: 9092)       │
                                     │ Topic: soa.s10.t17.events                 │
                                     │ Partition Key: Serial Number              │
                                     └───────────────────────────────────────────┘
```

---

### 4. Database Isolation Principle
To strictly satisfy CO3, no microservice can directly access another service's database or execute cross-schema joins:

1. **`auth_db` (Port 5432)**:
   - Tables: `users`
   - Owns user credentials, hashed passwords, roles, and organization affiliations.
2. **`certificate_db` (Port 5433)**:
   - Tables: `certificates`
   - Owns serial numbers, generation quantities (MWh), energy sources, and status (`ACTIVE`, `RETIRED`).
   - Unique constraint: `serial_number`.
3. **`ownership_db` (Port 5434)**:
   - Tables: `ownership_transfers`, `ownership_locks`
   - Owns historical audit ledger of ownership transfers and permanent locks triggered by retirement events.
4. **`retirement_db` (Port 5435)**:
   - Tables: `retirements`, `outbox_events`
   - Owns claims, claimant beneficiaries, cryptographic SHA-256 seals, and transactional outbox events.
   - Unique constraint: `serial_number` (strictly prevents double retirement at database level).

---

### 5. Kafka Event Choreography & Deduplication (CO1)
- **Topic**: `soa.s10.t17.events`
- **Partition Key**: `aggregateId` (Certificate Serial Number) ensures FIFO order per certificate.
- **Transactional Outbox**: During retirement, the `Retirement` entity and `OutboxEvent` are committed inside the SAME local database transaction. Even if the service crashes, staged events are re-published upon restart.
- **Idempotent Consumer**: `OwnershipService` checks its `processedEventIds` cache and `ownership_locks` table. Repeated or redelivered Kafka messages produce zero additional state changes.
- **Dead-Letter Queue (DLQ)**: Corrupted or incompatible schema events route to `soa.s10.t17.events.DLQ` without blocking the main consumer thread.
