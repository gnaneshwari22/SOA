import React, { useState } from 'react';
import { 
  BookOpen, 
  Layers, 
  Database, 
  Radio, 
  ShieldCheck, 
  Server, 
  Code2, 
  Copy, 
  Check, 
  Terminal, 
  FileCode 
} from 'lucide-react';

export const ArchitectureDocs: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'overview' | 'services' | 'kafka' | 'db' | 'testing'>('overview');
  const [copiedCurl, setCopiedCurl] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCurl(id);
    setTimeout(() => setCopiedCurl(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          System Architecture, Course Outcomes & OpenAPI Documentation
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Complete SOA microservices technical specifications, database isolation schemas, and Kafka event contracts.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3 text-xs">
        {[
          { key: 'overview', label: 'CO1–CO4 Alignment' },
          { key: 'services', label: 'Microservices & REST APIs' },
          { key: 'kafka', label: 'Kafka Event Contract' },
          { key: 'db', label: 'Isolated Databases' },
          { key: 'testing', label: 'Testing & Docker Guide' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveSection(tab.key as any)}
            className={`px-3 py-1.5 rounded transition-colors ${
              activeSection === tab.key
                ? 'bg-emerald-600 text-white font-medium'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview & CO Alignment */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-400">CO1 — SOA & Event-Driven Architecture</span>
              <h3 className="text-sm font-semibold text-white">Microservice Domain Boundaries & Kafka</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Auth, Certificate, Ownership, and Retirement services are independent Spring Boot applications.
                The central business rule (one certificate retired only once) is enforced transactionally and propagated
                asynchronously via versioned Kafka event <code className="text-emerald-300">CertificateRetired</code> on topic <code className="text-emerald-300">soa.s10.t17.events</code> with aggregate key ordering.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-400">CO2 — Security & Observability</span>
              <h3 className="text-sm font-semibold text-white">Signed JWT, RBAC & Actuator</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                BCrypt password hashing, signed JWT authentication at Gateway and domain services, organization-level tenant boundaries,
                and role permissions (<code className="text-emerald-300">registryOfficer</code> vs <code className="text-emerald-300">certificateOwner</code>).
                Structured audit logging, Actuator health endpoints, Micrometer metrics, and correlation IDs on all requests.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-400">CO3 — Discovery & Database Isolation</span>
              <h3 className="text-sm font-semibold text-white">Eureka, Spring Cloud Gateway & Isolated Schemas</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dynamic service registration via Netflix Eureka server. Gateway routes by service name rather than IP.
                Load balancing across dual instances of Certificate Service with zero-downtime failover demonstration.
                Complete database isolation: each domain service owns its PostgreSQL schema with zero cross-database queries.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded space-y-2">
              <span className="text-xs font-mono font-bold text-emerald-400">CO4 — Testing & DevOps Containerization</span>
              <h3 className="text-sm font-semibold text-white">JUnit 5, Docker Compose & CI/CD</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Unit tests (valid issuance, duplicate serial rejection, invalid transfers), JPA persistence tests,
                integration tests, Kafka event contract tests, and concurrency load tests. Complete multi-container
                <code className="text-emerald-300">docker-compose.yml</code> and GitHub Actions workflow (<code className="text-emerald-300">.github/workflows/ci-cd.yml</code>).
              </p>
            </div>
          </div>

          {/* Architecture Visual Topology */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded space-y-4">
            <h3 className="text-sm font-semibold text-white">Microservices Architecture Flowchart</h3>
            <div className="p-4 bg-slate-950 border border-slate-800 rounded font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
{`                                 ┌───────────────────────────────────┐
                                 │     React + Vite Frontend Client  │
                                 └─────────────────┬─────────────────┘
                                                   │ HTTPS / REST (Bearer JWT)
                                                   ▼
                                 ┌───────────────────────────────────┐
                    ┌───────────►│ Spring Cloud Gateway (Port 8080)  │◄───────────┐
                    │            └─────────────────┬─────────────────┘            │
                    │                              │                              │
       Service Registration                        │ Service Discovery (lb://)    │
                    │                              ▼                              │
                    │            ┌───────────────────────────────────┐            │
                    ├───────────►│    Netflix Eureka Server (8761)   │◄───────────┤
                    │            └───────────────────────────────────┘            │
                    │                                                             │
         ┌──────────┴──────────┐       ┌─────────────────────┐       ┌────────────┴────────┐
         │ Auth Service (8081) │       │Certificate Svc(8082)│       │Ownership Svc (8083) │
         │   (Postgres Auth)   │       │ (Postgres Certs)    │       │ (Postgres Transfers)│
         └─────────────────────┘       └──────────┬──────────┘       └──────────▲──────────┘
                                                  │                             │
                                                  │ Synchronous REST            │ Consumer: Lock
                                                  ▼                             │ Ownership on Retire
                                       ┌─────────────────────┐                  │
                                       │Retirement Svc (8084)├──────────────────┘
                                       │(Postgres Retirements│
                                       └──────────┬──────────┘
                                                  │
                                                  │ Transactional Outbox
                                                  ▼
                                       ┌──────────────────────────────────────────────┐
                                       │ Apache Kafka Cluster (Broker: 9092)          │
                                       │ Topic: soa.s10.t17.events (Key: Serial No)   │
                                       └──────────────────────────────────────────────┘`}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Microservices & REST APIs */}
      {activeSection === 'services' && (
        <div className="space-y-6 text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">REST Endpoints & Contract Catalog</h3>

            <div className="space-y-4">
              {/* Endpoint 1: Issue Certificate */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 font-mono font-bold rounded">POST</span>
                    <span className="font-mono text-white text-xs">/api/certificates</span>
                  </div>
                  <span className="text-slate-400 font-mono">Role: registryOfficer</span>
                </div>
                <p className="text-slate-400">Issues a new renewable energy certificate with unique serial number.</p>
                <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-slate-300">
{`{
  "serialNumber": "REC101",
  "energySource": "Solar",
  "energyQuantityMWh": 500,
  "currentOwnerOrganization": "Helios Solar Energy Corp",
  "facilityName": "Mojave Solar Facility",
  "gridRegion": "US-CAISO"
}`}
                </div>
              </div>

              {/* Endpoint 2: Ownership Transfer */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-cyan-950 text-cyan-400 font-mono font-bold rounded">POST</span>
                    <span className="font-mono text-white text-xs">/api/ownership/transfer</span>
                  </div>
                  <span className="text-slate-400 font-mono">Role: certificateOwner (Current Owner)</span>
                </div>
                <p className="text-slate-400">Transfers ownership of an ACTIVE certificate. Rejects if RETIRED or unauthorized.</p>
                <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-slate-300">
{`{
  "serialNumber": "REC101",
  "newOwnerOrganization": "EcoTech Industries Inc",
  "notes": "Bilateral OTC carbon settlement"
}`}
                </div>
              </div>

              {/* Endpoint 3: Retirement */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-amber-950 text-amber-400 font-mono font-bold rounded">POST</span>
                    <span className="font-mono text-white text-xs">/api/retirements</span>
                  </div>
                  <span className="text-slate-400 font-mono">Role: certificateOwner / Officer</span>
                </div>
                <p className="text-slate-400">Atomically retires certificate against renewable energy claim. Emits Kafka outbox event.</p>
                <div className="p-2 bg-slate-900 rounded font-mono text-[11px] text-slate-300">
{`{
  "serialNumber": "REC101",
  "claimReference": "CLAIM001",
  "claimantOrganization": "EcoTech Industries Inc",
  "purpose": "100% Scope 2 GHG compliance"
}`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Kafka Event Contract */}
      {activeSection === 'kafka' && (
        <div className="space-y-6 text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">
                Kafka Topic: <code className="text-emerald-400 font-mono">soa.s10.t17.events</code>
              </h3>
              <span className="font-mono text-slate-400">Event: CertificateRetired (v1.0.0)</span>
            </div>

            <p className="text-slate-400 leading-relaxed">
              Message keys are set to the certificate serial number (<code className="text-slate-200">aggregateId</code>)
              so Kafka guarantees strict partition ordering for all lifecycle events of any given certificate.
            </p>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded font-mono text-slate-300 text-[11px] space-y-2">
              <span className="text-emerald-400 font-bold block">JSON SCHEMA SPECIFICATION:</span>
              <pre className="overflow-x-auto">
{`{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "CertificateRetiredEvent",
  "type": "object",
  "required": [
    "eventId",
    "aggregateId",
    "schemaVersion",
    "occurredAt",
    "correlationId",
    "eventType",
    "payload"
  ],
  "properties": {
    "eventId": { "type": "string", "format": "uuid" },
    "aggregateId": { "type": "string", "description": "Certificate serial number" },
    "schemaVersion": { "type": "string", "enum": ["1.0.0"] },
    "occurredAt": { "type": "string", "format": "date-time" },
    "correlationId": { "type": "string", "format": "uuid" },
    "eventType": { "type": "string", "enum": ["CertificateRetired"] },
    "payload": {
      "type": "object",
      "required": ["serialNumber", "claimReference", "claimantOrganization", "energyQuantityMWh", "energySource", "retirementTimestamp", "retiredBy"],
      "properties": {
        "serialNumber": { "type": "string" },
        "claimReference": { "type": "string" },
        "claimantOrganization": { "type": "string" },
        "energyQuantityMWh": { "type": "number" },
        "energySource": { "type": "string" },
        "retirementTimestamp": { "type": "string" },
        "retiredBy": { "type": "string" }
      }
    }
  }
}`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Database Isolation */}
      {activeSection === 'db' && (
        <div className="space-y-6 text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Database Isolation Invariants</h3>
            <p className="text-slate-400">
              Each microservice connects exclusively to its dedicated PostgreSQL database schema. No service can execute SQL queries or joins against another service's tables.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded space-y-2">
                <span className="font-mono text-emerald-400 font-bold">1. auth_db (Port 5432)</span>
                <p className="text-slate-400">Owns: <code className="text-white">users</code>, <code className="text-white">user_roles</code>, <code className="text-white">refresh_tokens</code></p>
                <span className="text-[11px] text-slate-500">Unique constraint on <code className="text-slate-400">email</code>, BCrypt hashed passwords.</span>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded space-y-2">
                <span className="font-mono text-emerald-400 font-bold">2. certificate_db (Port 5433)</span>
                <p className="text-slate-400">Owns: <code className="text-white">certificates</code></p>
                <span className="text-[11px] text-slate-500">Unique constraint on <code className="text-slate-400">serial_number</code>, indexes on status & owner.</span>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded space-y-2">
                <span className="font-mono text-emerald-400 font-bold">3. ownership_db (Port 5434)</span>
                <p className="text-slate-400">Owns: <code className="text-white">ownership_transfers</code>, <code className="text-white">ownership_locks</code></p>
                <span className="text-[11px] text-slate-500">Immutable ledger of historical owners and timestamps.</span>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded space-y-2">
                <span className="font-mono text-emerald-400 font-bold">4. retirement_db (Port 5435)</span>
                <p className="text-slate-400">Owns: <code className="text-white">retirements</code>, <code className="text-white">outbox_events</code>, <code className="text-white">consumed_events</code></p>
                <span className="text-[11px] text-slate-500">Unique constraint on <code className="text-slate-400">serial_number</code> prevents double retirement.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Testing & Docker Guide */}
      {activeSection === 'testing' && (
        <div className="space-y-6 text-xs">
          <div className="bg-slate-900 border border-slate-800 rounded p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">Local Run & Verification Commands</h3>

            <div className="space-y-3 font-mono text-[11px]">
              <div>
                <span className="text-slate-400 font-sans font-medium text-xs block mb-1">
                  1. Launch Full Stack Microservices with Docker Compose:
                </span>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded text-slate-200 flex items-center justify-between">
                  <code>docker-compose -f infrastructure/docker-compose.yml up -d --build</code>
                  <button
                    onClick={() => copyToClipboard('docker-compose -f infrastructure/docker-compose.yml up -d --build', 'c1')}
                    className="p-1 hover:text-emerald-400"
                  >
                    {copiedCurl === 'c1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-sans font-medium text-xs block mb-1">
                  2. Execute Automated JUnit 5 Test Suite across all Spring Boot modules:
                </span>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded text-slate-200 flex items-center justify-between">
                  <code>cd backend && mvn clean test</code>
                  <button
                    onClick={() => copyToClipboard('cd backend && mvn clean test', 'c2')}
                    className="p-1 hover:text-emerald-400"
                  >
                    {copiedCurl === 'c2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-sans font-medium text-xs block mb-1">
                  3. Run Repeatable Load Test for Key Operations:
                </span>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded text-slate-200 flex items-center justify-between">
                  <code>{'curl -X POST http://localhost:8080/api/load-test/concurrent-retirements -H "Content-Type: application/json" -d \'{"serialNumber":"REC101","totalRequests":20}\''}</code>
                  <button
                    onClick={() => copyToClipboard('curl -X POST http://localhost:8080/api/load-test/concurrent-retirements -H "Content-Type: application/json" -d \'{"serialNumber":"REC101","totalRequests":20}\'', 'c3')}
                    className="p-1 hover:text-emerald-400"
                  >
                    {copiedCurl === 'c3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
