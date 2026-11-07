import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Flame, 
  Lock, 
  ArrowRight, 
  Cpu, 
  RefreshCw,
  Zap,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Certificate, RetirementRecord } from '../types';
import { retirementApi, systemApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { TabType } from './Navigation';

interface RetirementViewProps {
  certificates: Certificate[];
  onRefresh: () => void;
  setActiveTab: (tab: TabType) => void;
  preSelectedSerial?: string;
}

export const RetirementView: React.FC<RetirementViewProps> = ({
  certificates,
  onRefresh,
  setActiveTab,
  preSelectedSerial,
}) => {
  const { user } = useAuth();

  const [serialNumber, setSerialNumber] = useState(preSelectedSerial || '');
  const [claimReference, setClaimReference] = useState('');
  const [claimantOrg, setClaimantOrg] = useState('');
  const [purpose, setPurpose] = useState('Scope 2 GHG Protocol carbon-neutral compliance');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<{
    retirement: RetirementRecord;
    kafkaEvent: any;
  } | null>(null);

  // Concurrency tester state
  const [concurrencyRunning, setConcurrencyRunning] = useState(false);
  const [concurrencyResult, setConcurrencyResult] = useState<any | null>(null);

  useEffect(() => {
    if (preSelectedSerial) {
      setSerialNumber(preSelectedSerial);
    }
  }, [preSelectedSerial]);

  // Pre-fill claimant org based on selected certificate or current logged in org
  const selectedCert = certificates.find(
    (c) => c.serialNumber.toUpperCase() === serialNumber.trim().toUpperCase()
  );

  useEffect(() => {
    if (selectedCert) {
      setClaimantOrg(selectedCert.currentOwnerOrganization);
      const yr = new Date().getFullYear();
      const code = Math.floor(100 + Math.random() * 900);
      setClaimReference(`CLM-${yr}-${code}`);
    }
  }, [selectedCert]);

  const handleRetirement = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessResult(null);

    if (!serialNumber.trim() || !claimReference.trim() || !claimantOrg.trim()) {
      setError('Serial number, claim reference, and claimant organization are all required');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await retirementApi.retire({
        serialNumber: serialNumber.trim().toUpperCase(),
        claimReference: claimReference.trim(),
        claimantOrganization: claimantOrg.trim(),
        purpose: purpose.trim(),
      });

      setSuccessResult({
        retirement: res.retirement,
        kafkaEvent: res.kafkaEvent,
      });

      // Celebration confetti for successful retirement
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10b981', '#06b6d4', '#f59e0b'],
        });
      } catch (e) {
        // ignore
      }

      onRefresh();
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Retirement request failed';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Immediate Duplicate Claim Re-Attempt Simulation
  const handleSimulateDuplicateAttempt = async () => {
    setError(null);
    setSuccessResult(null);
    setIsSubmitting(true);

    try {
      await retirementApi.retire({
        serialNumber: serialNumber.trim().toUpperCase() || 'REC101',
        claimReference: `DUPLICATE-RE-ATTEMPT-${Date.now()}`,
        claimantOrganization: claimantOrg.trim() || 'Rogue Claimant Corp',
        purpose: 'Attempting to double-claim retired asset',
      });
      // Should not reach here
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Request safely rejected by duplicate prevention filter';
      setError(msg);
      onRefresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  // High Concurrency Race Condition Tester
  const handleRunRaceConditionTest = async () => {
    setConcurrencyRunning(true);
    setConcurrencyResult(null);
    try {
      const target = serialNumber.trim().toUpperCase() || 'REC101';
      const result = await systemApi.runConcurrencyLoadTest(target, 20);
      setConcurrencyResult(result);
      onRefresh();
    } catch (err: any) {
      setError('Load test failed');
    } finally {
      setConcurrencyRunning(false);
    }
  };

  const isRetired = selectedCert?.status === 'RETIRED';

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-white">
          Certificate Retirement Protocol
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Permanently retire certificates against clean energy claims with transactional idempotency and Kafka streaming.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Retirement Form & Execution */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">
                Execute Retirement Transaction
              </h2>
              <span className="text-[11px] font-mono text-emerald-400">
                Rule: 1 Serial = 1 Retirement Only
              </span>
            </div>

            {error && (
              <div className="p-4 bg-red-950/40 border border-red-800 rounded text-xs text-red-300 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-red-200">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>TRANSACTION REJECTED — DUPLICATE / ELIGIBILITY VIOLATION</span>
                </div>
                <p className="text-red-300 pl-6">{error}</p>
              </div>
            )}

            {successResult && (
              <div className="p-4 bg-emerald-950/40 border border-emerald-800 rounded text-xs text-emerald-300 space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>SUCCESSFUL RETIREMENT TRANSACTION</span>
                </div>
                <div className="pl-6 space-y-1 text-slate-300">
                  <p>
                    Certificate <span className="font-mono font-bold text-white">{successResult.retirement.serialNumber}</span> was permanently retired against claim{' '}
                    <span className="font-mono text-white">{successResult.retirement.claimReference}</span>.
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Kafka Event: {successResult.kafkaEvent.eventId} · Topic: {successResult.kafkaEvent.topic} (Partition {successResult.kafkaEvent.partition})
                  </p>
                </div>
                <div className="pt-2 pl-6 flex items-center gap-3">
                  <button
                    onClick={() => setActiveTab('registry')}
                    className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium"
                  >
                    View in Retired Certificates Registry →
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleRetirement} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Certificate Serial Number *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                    placeholder="e.g. REC101"
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                    required
                  />
                  {certificates.length > 0 && (
                    <select
                      onChange={(e) => {
                        if (e.target.value) setSerialNumber(e.target.value);
                      }}
                      className="px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-300 font-mono text-xs focus:outline-none"
                    >
                      <option value="">Quick Select...</option>
                      {certificates.map((c) => (
                        <option key={c.id} value={c.serialNumber}>
                          {c.serialNumber} ({c.status})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Certificate Verification Badge */}
              {selectedCert && (
                <div
                  className={`p-3.5 rounded border text-xs space-y-1.5 ${
                    isRetired ? 'bg-red-950/20 border-red-800/70' : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-white font-bold">{selectedCert.serialNumber}</span>
                    <span
                      className={`font-mono text-xs font-bold ${
                        isRetired ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {selectedCert.status === 'RETIRED' ? 'ALREADY RETIRED (LOCKED)' : 'ACTIVE & ELIGIBLE'}
                    </span>
                  </div>
                  <div className="text-slate-400 text-xs">
                    Owner: <span className="text-slate-200">{selectedCert.currentOwnerOrganization}</span> · {selectedCert.energyQuantityMWh} MWh ({selectedCert.energySource})
                  </div>
                  {isRetired && (
                    <div className="text-red-300 text-[11px] pt-1">
                      Notice: This certificate has already been retired. Submitting again will be rejected by the Retirement Service.
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Claim Reference Code *</label>
                <input
                  type="text"
                  value={claimReference}
                  onChange={(e) => setClaimReference(e.target.value)}
                  placeholder="e.g. CLM-2026-ECO-Q1"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Claimant Organization *</label>
                <input
                  type="text"
                  value={claimantOrg}
                  onChange={(e) => setClaimantOrg(e.target.value)}
                  placeholder="e.g. EcoTech Industries Inc"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Purpose / Sustainability Claim Scope</label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. 100% Green Energy Matching for 2026 operations"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded transition-colors flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {isSubmitting ? 'Verifying & Retiring...' : 'Retire Certificate'}
                </button>

                {/* Simulation button for Demonstration Scenario B */}
                <button
                  type="button"
                  onClick={handleSimulateDuplicateAttempt}
                  disabled={isSubmitting}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium rounded transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                  title="Simulate Scenario B: Attempt to claim an already retired certificate to prove rejection"
                >
                  <Flame className="w-4 h-4 text-amber-400" />
                  Simulate Duplicate Claim
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Invariant Explanations & Concurrency Test Runner */}
        <div className="lg:col-span-5 space-y-6">
          {/* Business Invariant Rule Card */}
          <div className="bg-slate-900 border border-slate-800 rounded p-5 space-y-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              Double-Claim Prevention Invariant
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              In renewable energy registries, double counting destroys carbon market integrity. The Retirement Service enforces:
            </p>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
              <li>
                <strong className="text-white">State Transition:</strong> Certificate status changes from <span className="font-mono text-emerald-400">ACTIVE</span> to <span className="font-mono text-slate-400">RETIRED</span> atomically.
              </li>
              <li>
                <strong className="text-white">Immutability:</strong> Once retired, it cannot be transferred or retired again.
              </li>
              <li>
                <strong className="text-white">Transactional Outbox:</strong> Exactly one versioned <span className="font-mono text-emerald-300">CertificateRetired</span> event is published to Kafka.
              </li>
            </ul>
          </div>

          {/* Concurrency Load Test Runner (Proves CO4 Concurrency Safety) */}
          <div className="bg-slate-900 border border-slate-800 rounded p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                Concurrent Race Condition Test
              </h3>
              <span className="text-[11px] text-slate-400 font-mono">20 parallel hits</span>
            </div>

            <p className="text-xs text-slate-400">
              Dispatches 20 simultaneous duplicate retirement requests against{' '}
              <span className="font-mono text-white">{serialNumber || 'REC101'}</span> to prove that database locking and constraints allow exactly ONE success.
            </p>

            <button
              onClick={handleRunRaceConditionTest}
              disabled={concurrencyRunning}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded text-xs font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${concurrencyRunning ? 'animate-spin' : ''}`} />
              {concurrencyRunning ? 'Running 20 Concurrent Requests...' : 'Run Concurrency Test'}
            </button>

            {concurrencyResult && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded text-xs space-y-2">
                <div className="flex items-center justify-between font-mono">
                  <span className="text-slate-400">Result:</span>
                  <span className="text-emerald-400 font-bold">{concurrencyResult.conclusion}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-slate-400 font-mono text-[11px]">
                  <div>Successful Commits: <span className="text-white font-bold">{concurrencyResult.successCount}</span></div>
                  <div>Duplicate Rejections: <span className="text-amber-400 font-bold">{concurrencyResult.duplicateRejectedCount}</span></div>
                  <div>Total Requests: <span className="text-white">{concurrencyResult.totalRequests}</span></div>
                  <div>Avg Latency: <span className="text-white">{concurrencyResult.averageLatencyMs} ms</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
