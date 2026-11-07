# REST API & OpenAPI Documentation
## SOA Programming and Microservices — Team 17

All client API calls pass through the **Spring Cloud API Gateway** running on port `8080`.

---

### Authentication & Headers
- **Authorization**: `Bearer <JWT_TOKEN>`
- **X-Correlation-Id**: Unique UUID tracing the request across Gateway, microservices, and Kafka events.

---

### 1. Auth Service (`/api/auth`)

#### `POST /api/auth/login`
- **Description**: Authenticate user and receive signed JWT.
- **Request Body**:
```json
{
  "email": "officer@registry.org",
  "password": "password"
}
```
- **Response `200 OK`**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresInSeconds": 28800,
  "user": {
    "id": "usr-101",
    "username": "officer_jane",
    "email": "officer@registry.org",
    "role": "registryOfficer",
    "organization": "Global Clean Energy Registry"
  }
}
```

#### `POST /api/auth/register`
- **Description**: Register a new market participant organization account.
- **Response `201 Created`**

---

### 2. Certificate Service (`/api/certificates`)

#### `GET /api/certificates`
- **Query Params**: `search`, `owner`, `status` (`ACTIVE` | `RETIRED`), `energySource`
- **Response `200 OK`**: List of certificate records.

#### `POST /api/certificates`
- **Required Role**: `registryOfficer`
- **Request Body**:
```json
{
  "serialNumber": "REC101",
  "energySource": "Solar",
  "energyQuantityMWh": 500,
  "currentOwnerOrganization": "Helios Solar Energy Corp",
  "facilityName": "Mojave Solar Array IV",
  "gridRegion": "US-CAISO",
  "issueDate": "2026-03-01"
}
```
- **Response `201 Created`**: Returns newly created Certificate entity.
- **Response `409 Conflict`**: Returned if serial number already exists.
- **Response `403 Forbidden`**: Returned if caller role is not `registryOfficer`.

---

### 3. Ownership Service (`/api/ownership`)

#### `POST /api/ownership/transfer`
- **Required Role**: `certificateOwner` (must match current owner) or `registryOfficer`
- **Request Body**:
```json
{
  "serialNumber": "REC101",
  "newOwnerOrganization": "EcoTech Industries Inc",
  "notes": "Bilateral OTC contract #449"
}
```
- **Response `200 OK`**: Ownership updated and transfer audit log recorded.
- **Response `400 Bad Request`**: If certificate status is `RETIRED` (transfer prohibited).
- **Response `403 Forbidden`**: If caller organization does not own the certificate.

#### `GET /api/ownership/history/{serialNumber}`
- **Response `200 OK`**: Full historical list of transfers for the serial number with actors and timestamps.

---

### 4. Retirement Service (`/api/retirements`)

#### `POST /api/retirements`
- **Required Role**: `certificateOwner` (must match current owner) or `registryOfficer`
- **Request Body**:
```json
{
  "serialNumber": "REC101",
  "claimReference": "CLAIM001",
  "claimantOrganization": "EcoTech Industries Inc",
  "purpose": "Scope 2 GHG compliance"
}
```
- **Response `201 Created`**:
```json
{
  "message": "Certificate successfully retired",
  "retirement": {
    "id": "ret-174208",
    "serialNumber": "REC101",
    "claimReference": "CLAIM001",
    "claimantOrganization": "EcoTech Industries Inc",
    "retirementTimestamp": "2026-03-01T14:30:00Z",
    "retiredBy": "corporate@eco-tech.com",
    "energyQuantityMWh": 500,
    "energySource": "Solar",
    "verificationHash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
  },
  "kafkaEvent": {
    "eventId": "e1001-f23a",
    "topic": "soa.s10.t17.events",
    "partition": 1,
    "offset": 105
  }
}
```
- **Response `400 Bad Request`**: Returned if certificate has ALREADY been retired. Enforces the central rule:
  `One certificate serial number can be successfully retired only once.`

#### `GET /api/retirements`
- **Response `200 OK`**: List of all retired certificates with claims and cryptographic verification seals.
