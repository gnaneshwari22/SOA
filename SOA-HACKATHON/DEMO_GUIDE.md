# Final Demonstration Guide
## Step-by-Step Evaluator Script for Scenarios A through E

This document provides exact steps to demonstrate compliance with course outcomes **CO1, CO2, CO3, and CO4**.

---

### Scenario A — Normal Workflow
1. **Login as Officer**: Select "Registry Officer" (`officer@registry.org`) from the top quick identity menu.
2. **Issue Certificate**: Navigate to "Certificates" tab, click "Issue New Certificate", enter Serial `REC101`, 500 MWh Solar, initial owner `Helios Solar Energy Corp`. Click "Issue".
3. **Transfer Ownership**: Navigate to "Transfer" tab, enter `REC101`, select new owner `EcoTech Industries Inc`. Click "Execute Ownership Transfer".
4. **Switch Identity to Buyer**: Select "EcoTech Industries" (`corporate@eco-tech.com`) from the top quick menu.
5. **Retire Certificate**: Navigate to "Retire" tab, enter `REC101`, claim reference `CLAIM001`, claimant `EcoTech Industries Inc`. Click "Retire Certificate".
6. **Verify Immutable Proof**: Navigate to "Retired Registry", locate `REC101`, click "View Proof" to inspect the official cryptographic seal.
7. **Verify Kafka Event**: Navigate to "SOA & Kafka" tab to view event publication on topic `soa.s10.t17.events` at partition offset.

---

### Scenario B — Duplicate Claim Prevention
1. In the "Retire" tab, attempt to retire `REC101` a second time against a new claim.
2. Observe the immediate `400 Bad Request` rejection with message:
   `"Duplicate Claim Prohibited: Certificate REC101 is already RETIRED. Once a certificate has been retired, it must never be transferred or retired again."`
3. Inspect the "Retired Registry" to confirm that exactly ONE record exists for `REC101`.
4. In the "SOA & Kafka" tab, click "Test Redelivery" on the event. Observe that the Idempotency filter recognizes the duplicate `eventId` and discards it with **zero business effects created**.

---

### Scenario C — Security & Role-Based Access Control
1. **Unauthenticated Call**: Attempt an API request without Bearer token. System returns `401 Unauthorized`.
2. **Unauthorized Issuance**: Switch identity to "Helios Solar Corp" (`certificateOwner`). Attempt to issue a certificate. System returns `403 Forbidden` (only `registryOfficer` permitted).
3. **Cross-Tenant Tampering**: As Helios, attempt to transfer `REC-2026-WIND-088` (owned by Boreas Wind). System returns `403 Forbidden`.
4. **Audit Trail**: Check "System & Event Activity" to verify all unauthorized attempts are logged with correlation IDs.

---

### Scenario D — Microservices Resilience & Eureka Failover
1. Navigate to "SOA & Kafka" tab. Note the two instances of `CERTIFICATE-SERVICE`:
   - `cert-1:8082` (UP)
   - `cert-2:8085` (UP)
2. Click "Stop Instance 2". Observe status changes to `DOWN`.
3. Browse the "Certificates" tab. Notice that requests continue to succeed with 0% error rate because Spring Cloud Gateway automatically routes traffic to healthy `cert-1:8082`.
4. Click "Restart Instance 2" to restore dual-instance load balancing.

---

### Scenario E — High-Concurrency Load Testing & CI/CD
1. In "Demo Runner" or "Retire" tab, click "Run Concurrency Test" (fires 20 simultaneous duplicate retirement hits).
2. Observe the measured results:
   - `Successful Commits: 1`
   - `Duplicate Rejections: 19`
   - `Throughput: >200 req/s`
3. Inspect `.github/workflows/ci-cd.yml` to review the automated Maven build, JUnit 5 test execution, and Docker build pipeline.
