# Kafka Event-Driven Architecture Specification
## Topic: `soa.s10.t17.events`

### 1. Mandatory Common Event Envelope
Every event published to topic `soa.s10.t17.events` must conform to the following common envelope structure:

```json
{
  "eventId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "aggregateId": "REC101",
  "schemaVersion": "1.0.0",
  "occurredAt": "2026-03-01T14:30:00Z",
  "correlationId": "req-9901-aa11-bb22-cc33",
  "eventType": "CertificateRetired",
  "payload": {
    "serialNumber": "REC101",
    "claimReference": "CLAIM001",
    "claimantOrganization": "EcoTech Industries Inc",
    "energyQuantityMWh": 500,
    "energySource": "Solar",
    "retirementTimestamp": "2026-03-01T14:30:00Z",
    "retiredBy": "corporate@eco-tech.com"
  }
}
```

---

### 2. Partition Key & Ordering
- **Partition Key**: The certificate serial number (`aggregateId`) is passed as the Kafka message key.
- This guarantees that all lifecycle messages for any certificate are routed to the **same partition**, ensuring strict in-order delivery.

---

### 3. Transactional Outbox Pattern
To prevent distributed transaction failures (dual-write problem):
1. In `RetirementService.retireCertificate()`:
   - Database writes `Retirement` entity to table `retirements`.
   - Database writes `OutboxEvent` to table `outbox_events`.
   - Both statements commit within the SAME local PostgreSQL transaction.
2. An asynchronous worker or CDC connector reads unpublished outbox rows and delivers them to Kafka.
3. Upon Kafka ACK, the outbox record is marked `published = true`.
4. If the service restarts or the network partitions, un-published events are safely re-dispatched.

---

### 4. Idempotent Processing & Deduplication
- Because Kafka guarantees **at-least-once** delivery, consumer applications must handle duplicate messages safely without producing duplicate business effects.
- Downstream consumer (`OwnershipService.CertificateRetiredConsumer`):
  1. Reads `eventId` from event header.
  2. Checks `processedEventIds` cache and `ownership_locks` table.
  3. If already processed, logs duplicate warning and drops event (0 duplicate DB mutations).
  4. If new, inserts lock and records `eventId`.

---

### 5. Dead-Letter Queue (DLQ) Strategy
- Malformed payloads, poison pills, or events with unsupported schema versions (e.g. `schemaVersion > 1.x`) are caught by the consumer error handler.
- The invalid message is routed to topic `soa.s10.t17.events.DLQ` with headers:
  - `x-exception-message`
  - `x-original-topic`
  - `x-failed-timestamp`
- This ensures the main topic consumer partition does not block or crash.
