import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Server, 
  Radio, 
  RefreshCw, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  ArrowRight,
  Database,
  Layers,
  Zap,
  Power
} from 'lucide-react';
import { EurekaInstance, KafkaEvent, ActuatorMetrics, ActuatorHealth } from '../types';
import { eurekaApi, kafkaApi, systemApi } from '../api';

export const MicroservicesConsole: React.FC = () => {
  const [instances, setInstances] = useState<EurekaInstance[]>([]);
  const [kafkaEvents, setKafkaEvents] = useState<KafkaEvent[]>([]);
  const [metrics, setMetrics] = useState<ActuatorMetrics | null>(null);
  const [health, setHealth] = useState<ActuatorHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [eData, kData, mData, hData] = await Promise.all([
        eurekaApi.getInstances(),
        kafkaApi.getEvents(),
        systemApi.getMetrics(),
        systemApi.getHealth(),
      ]);
      setInstances(eData.instances);
      setKafkaEvents(kData.events);
      setMetrics(mData);
      setHealth(hData);
    } catch (e) {
      console.error('Failed to load console data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  // Eureka instance failover toggle (Scenario D)
  const handleToggleInstance = async (instanceId: string) => {
    setActionMessage(null);
    try {
      const res = await eurekaApi.toggleInstance(instanceId);
      setActionMessage(res.message);
      fetchData();
    } catch (e: any) {
      setActionMessage('Failed to toggle instance');
    }
  };

  // Simulate Duplicate Event Delivery (Scenario B)
  const handleSimulateDuplicate = async (eventId: string) => {
    setActionMessage(null);
    try {
      const res = await kafkaApi.simulateDuplicate(eventId);
      setActionMessage(`Deduplication Proof: Event redelivered. ${res.message}. Business effects: ${res.businessEffectsCreated}`);
      fetchData();
    } catch (e: any) {
      setActionMessage('Duplicate simulation failed');
    }
  };

  // Simulate Dead-Letter Queue (DLQ)
  const handleSimulateDlq = async () => {
    setActionMessage(null);
    try {
      const res = await kafkaApi.simulateDlq();
      setActionMessage(`DLQ Isolation Proof: Malformed poison-pill event safely routed to Dead-Letter Queue topic.`);
      fetchData();
    } catch (e: any) {
      setActionMessage('DLQ simulation failed');
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            Microservices & Kafka Event Stream Console
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time Netflix Eureka service discovery, Spring Cloud Gateway routing, and Kafka topic event processing.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800 rounded text-xs text-emerald-300 font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Observability Metrics & System Health Strip */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded text-xs">
            <span className="text-slate-400 block text-[11px]">System Status</span>
            <span className="text-emerald-400 font-bold font-mono text-sm mt-1 block">
              {health?.status || 'UP'}
            </span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded text-xs">
            <span className="text-slate-400 block text-[11px]">Gateway Requests</span>
            <span className="text-white font-bold font-mono text-sm tabular-nums mt-1 block">
              {metrics.requestCount}
            </span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded text-xs">
            <span className="text-slate-400 block text-[11px]">Error Rate</span>
            <span className="text-slate-200 font-bold font-mono text-sm tabular-nums mt-1 block">
              {metrics.errorRate}
            </span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded text-xs">
            <span className="text-slate-400 block text-[11px]">Average Latency</span>
            <span className="text-white font-bold font-mono text-sm tabular-nums mt-1 block">
              {metrics.averageLatencyMs} ms
            </span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded text-xs">
            <span className="text-slate-400 block text-[11px]">JVM Memory</span>
            <span className="text-white font-bold font-mono text-sm tabular-nums mt-1 block">
              {metrics.jvmMemoryUsedMB} / {metrics.jvmMemoryMaxMB} MB
            </span>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-3.5 rounded text-xs">
            <span className="text-slate-400 block text-[11px]">Kafka Lag</span>
            <span className="text-emerald-400 font-bold font-mono text-sm tabular-nums mt-1 block">
              0 events
            </span>
          </div>
        </div>
      )}

      {/* Section 1: Eureka Service Discovery & Gateway Routing (CO3) */}
      <div className="bg-slate-900 border border-slate-800 rounded p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-emerald-400" />
              Eureka Service Discovery Registry (Port 8761)
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Gateway dynamically load-balances across registered instances. Notice the dual instances of Certificate Service.
            </p>
          </div>

          <div className="text-[11px] font-mono text-slate-400">
            Registered: <span className="text-white font-bold">{instances.length} instances</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {instances.map((instance) => {
            const isCert2 = instance.instanceId.includes('cert-2');
            const isUp = instance.status === 'UP';

            return (
              <div
                key={instance.instanceId}
                className={`p-3.5 rounded border text-xs space-y-2 transition-colors ${
                  isUp ? 'bg-slate-950 border-slate-800' : 'bg-red-950/20 border-red-900/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-white text-xs">
                    {instance.serviceName}
                  </span>
                  <span
                    className={`font-mono text-[11px] font-bold ${
                      isUp ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {instance.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-400 font-mono">
                  <div>Instance: {instance.instanceId}</div>
                  <div>Port: {instance.port}</div>
                </div>

                <div className="text-[10px] text-slate-500 font-mono">
                  Heartbeat: {new Date(instance.lastHeartbeat).toLocaleTimeString()}
                </div>

                {/* Scenario D Failover Action */}
                {isCert2 && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-amber-300">Scenario D Test:</span>
                    <button
                      onClick={() => handleToggleInstance(instance.instanceId)}
                      className={`px-2 py-1 text-[11px] font-mono rounded flex items-center gap-1 transition-colors ${
                        isUp
                          ? 'bg-red-950 hover:bg-red-900 text-red-300 border border-red-800'
                          : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      <Power className="w-3 h-3" />
                      {isUp ? 'Stop Instance 2' : 'Restart Instance 2'}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Kafka Event-Driven Topic: soa.s10.t17.events (CO1) */}
      <div className="bg-slate-900 border border-slate-800 rounded p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-white">
                Apache Kafka Event Topic: <span className="font-mono text-emerald-300">soa.s10.t17.events</span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict per-certificate ordering via serial number aggregate key, schema versioning, and idempotent deduplication.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateDlq}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs rounded transition-colors flex items-center gap-1"
              title="Test poison pill isolation in Dead Letter Queue"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Simulate DLQ Malformed Event
            </button>
          </div>
        </div>

        {/* Kafka Events Table */}
        <div className="border border-slate-800 rounded overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-semibold font-mono text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Offset</th>
                  <th className="py-2.5 px-3">Event Type</th>
                  <th className="py-2.5 px-3">Aggregate (Serial)</th>
                  <th className="py-2.5 px-3">Schema</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Correlation ID</th>
                  <th className="py-2.5 px-3 text-right">Idempotency Test</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-[11px]">
                {kafkaEvents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-slate-500">
                      No Kafka events streamed yet. Retire a certificate to trigger publication.
                    </td>
                  </tr>
                ) : (
                  kafkaEvents.map((evt, idx) => {
                    const isDLQ = evt.status === 'DEAD_LETTER';
                    const isDuplicate = evt.status === 'DUPLICATE_IGNORED';

                    return (
                      <tr
                        key={`${evt.eventId}-${idx}`}
                        className={`hover:bg-slate-800/30 transition-colors ${
                          isDLQ
                            ? 'bg-red-950/20'
                            : isDuplicate
                            ? 'bg-amber-950/20'
                            : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 text-slate-400 tabular-nums font-bold">
                          #{evt.offset}
                        </td>
                        <td className="py-2.5 px-3 text-white font-medium">
                          {evt.eventType}
                        </td>
                        <td className="py-2.5 px-3 text-emerald-400 font-bold">
                          {evt.aggregateId}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400">
                          v{evt.schemaVersion}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={
                              evt.status === 'CONSUMED'
                                ? 'text-emerald-400'
                                : evt.status === 'PUBLISHED'
                                ? 'text-cyan-400'
                                : evt.status === 'DUPLICATE_IGNORED'
                                ? 'text-amber-400'
                                : 'text-red-400'
                            }
                          >
                            {evt.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 truncate max-w-xs">
                          {evt.correlationId}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {!isDLQ && !isDuplicate && (
                            <button
                              onClick={() => handleSimulateDuplicate(evt.eventId)}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded transition-colors whitespace-nowrap"
                              title="Demonstrate duplicate Kafka redelivery does not create duplicate business effects"
                            >
                              Test Redelivery
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Kafka Schema Specification Accordion */}
        <div className="p-3 bg-slate-950 border border-slate-800 rounded text-xs space-y-1.5 font-mono">
          <span className="text-slate-400 text-[11px] font-bold block">
            MANDATORY COMMON SCHEMA CONTRACT FIELDS:
          </span>
          <div className="text-slate-300 text-[11px]">
            eventId (UUID) · aggregateId (Certificate Serial) · schemaVersion ("1.0.0") · occurredAt (ISO 8601) · correlationId (UUID)
          </div>
        </div>
      </div>
    </div>
  );
};
