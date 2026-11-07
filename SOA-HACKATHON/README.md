# Renewable Certificate Retirement System
## SOA Programming and Microservices — Team 17

An enterprise-grade, microservice-based renewable energy certificate (REC) registry that prevents duplicate claims, double counting, and unauthorized ownership transfers through transactional database locking, role-based access control, and Apache Kafka event streaming.

---

### Core Business Rule
> **One certificate serial number can be successfully retired only once.**
> Once a certificate has been retired, it must never be transferred or retired again.

---

### Key Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Recharts, Axios, Canvas Confetti.
- **Backend**: Java 21, Spring Boot 3.3.4, Spring Web, Spring Data JPA, Spring Security, BCrypt, Bean Validation, Maven.
- **Microservices Infrastructure**:
  - **Netflix Eureka Server** (`port 8761`) — Dynamic service registration and discovery.
  - **Spring Cloud Gateway** (`port 8080`) — Edge routing (`lb://`), CORS, and JWT authentication filter.
  - **Apache Kafka** (`port 9092`) — Topic `soa.s10.t17.events` with per-certificate aggregate key partitioning.
  - **PostgreSQL 16** — Dedicated isolated database per domain service (`auth_db`, `certificate_db`, `ownership_db`, `retirement_db`).
  - **Spring Boot Actuator & Micrometer** — System health and telemetry metrics.
- **DevOps & Testing**: JUnit 5, Mockito, AssertJ, Docker, Docker Compose, GitHub Actions CI/CD.

---

### Microservices Architecture Overview

1. **`eureka-server`** (Port 8761): Central registry where all microservices register heartbeats.
2. **`api-gateway`** (Port 8080): Routes incoming client requests using Eureka service discovery names (`lb://`).
3. **`auth-service`** (Port 8081): User registration, BCrypt password hashing, role management, and signed JWT issuance.
4. **`certificate-service`** (Port 8082, 8085): Certificate issuance, serial number uniqueness enforcement, and registry querying.
5. **`ownership-service`** (Port 8083): Ownership transfer execution, provenance ledger, and Kafka consumer locking.
6. **`retirement-service`** (Port 8084): Atomic retirement execution, duplicate claim rejection, and transactional outbox event publication.

---

### Course Outcomes (CO) Compliance

- **CO1 — SOA & Event-Driven Architecture**: Clean bounded contexts, transactional outbox pattern, versioned Kafka events (`CertificateRetired`), idempotent consumer deduplication.
- **CO2 — Security & Observability**: Signed JWTs, role-based permissions (`registryOfficer` vs `certificateOwner`), tenant organization isolation, Spring Boot Actuator `/actuator/health`, and structured audit logs.
- **CO3 — Service Discovery & Database Isolation**: Gateway dynamic load balancing, dual-instance resilience failover, and strict database isolation (0 cross-service database queries).
- **CO4 — Testing, CI/CD & DevOps**: Comprehensive JUnit 5 and Mockito test suites, repeatable concurrency race-condition load testing, multi-container `docker-compose.yml`, and GitHub Actions workflow (`.github/workflows/ci-cd.yml`).

---

### Quick Start Guide

#### 1. Running the Full Stack with Docker Compose
```bash
# Start all microservices, Kafka, Eureka, and 4 PostgreSQL databases
docker compose -f infrastructure/docker-compose.yml up -d --build

# Verify all services are healthy
docker compose -f infrastructure/docker-compose.yml ps
```

#### 2. Running Automated Tests
```bash
# Run unit and JPA integration tests across all microservices
cd backend
mvn clean test
```

#### 3. Running the Interactive Frontend Application
```bash
# In the repository root
npm install
npm run dev
# App is available at http://localhost:3000
```

---

### Demo User Accounts

| Email | Role | Organization | Permitted Operations |
| :--- | :--- | :--- | :--- |
| `officer@registry.org` | `registryOfficer` | Global Clean Energy Registry | Issue certificates, review full registry, oversee transfers |
| `solar@helios-power.com` | `certificateOwner` | Helios Solar Energy Corp | Transfer and manage owned Solar certificates (e.g. `REC101`) |
| `wind@boreas-wind.com` | `certificateOwner` | Boreas Wind Parks LLC | Transfer and manage owned Wind certificates |
| `corporate@eco-tech.com` | `certificateOwner` | EcoTech Industries Inc | Acquire certificates and retire against sustainability claims |

*Default password for all accounts is `password`.*

---

### Documentation Index

- [Architecture & Microservices Design](docs/ARCHITECTURE.md)
- [REST API & OpenAPI Documentation](docs/API_DOCUMENTATION.md)
- [Kafka Event Schemas & Deduplication Specification](docs/KAFKA_EVENTS.md)
- [Evaluator Demonstration Script (Scenarios A through E)](docs/DEMO_GUIDE.md)

---

### Known Limitations & Future Improvements
1. **Dynamic PPA Contract Verification**: Future iterations could integrate bilateral smart contracts for automated payment-versus-delivery settlement.
2. **Distributed Tracing**: Integration with OpenTelemetry / Zipkin for visual distributed trace flame graphs across Kafka and REST hops.
3. **Geo-Redundant Kafka Replication**: MirrorMaker 2 configuration for cross-region disaster recovery in high-volume carbon markets.
