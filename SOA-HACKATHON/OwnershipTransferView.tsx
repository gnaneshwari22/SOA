import React, { useState, useEffect } from 'react';
import { 
  ArrowLeftRight, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  Building, 
  Clock, 
  ShieldAlert, 
  UserCheck, 
  History 
} from 'lucide-react';
import { Certificate, OwnershipTransfer } from '../types';
import { ownershipApi, certificateApi } from '../api';
import { useAuth } from '../context/AuthContext';

interface OwnershipTransferViewProps {
  certificates: Certificate[];
  transfers: OwnershipTransfer[];
  onRefresh: () => void;
  preSelectedSerial?: string;
}

export const OwnershipTransferView: React.FC<OwnershipTransferViewProps> = ({
  certificates,
  transfers,
  onRefresh,
  preSelectedSerial,
}) => {
  const { user } = useAuth();

  const [serialNumber, setSerialNumber] = useState(preSelectedSerial || '');
  const [newOwner, setNewOwner] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Selected certificate info
  const selectedCert = certificates.find(
    (c) => c.serialNumber.toUpperCase() === serialNumber.trim().toUpperCase()
  );

  const [history, setHistory] = useState<OwnershipTransfer[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (preSelectedSerial) {
      setSerialNumber(preSelectedSerial);
    }
  }, [preSelectedSerial]);

  // Load history whenever serialNumber matches an existing certificate
  useEffect(() => {
    if (selectedCert) {
      setLoadingHistory(true);
      ownershipApi
        .getHistory(selectedCert.serialNumber)
        .then((data) => setHistory(data))
        .catch(() => setHistory([]))
        .finally(() => setLoadingHistory(false));
    } else {
      setHistory([]);
    }
  }, [selectedCert]);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!serialNumber.trim()) {
      setError('Certificate Serial Number is required');
      return;
    }

    if (!newOwner.trim()) {
      setError('New Owner Organization is required');
      return;
    }

    if (selectedCert && selectedCert.currentOwnerOrganization.toLowerCase() === newOwner.trim().toLowerCase()) {
      setError('New owner cannot be the same as current owner organization');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await ownershipApi.transfer({
        serialNumber: serialNumber.trim().toUpperCase(),
        newOwnerOrganization: newOwner.trim(),
        notes: notes.trim(),
      });

      setSuccess(`Certificate ${res.certificate.serialNumber} transferred to ${res.certificate.currentOwnerOrganization}`);
      onRefresh();
      // Reload history
      const updatedHistory = await ownershipApi.getHistory(res.certificate.serialNumber);
      setHistory(updatedHistory);
      setNewOwner('');
      setNotes('');
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Transfer failed';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isRetired = selectedCert?.status === 'RETIRED';
  const isAuthorized =
    user?.role === 'registryOfficer' ||
    (selectedCert && user?.organization.toLowerCase() === selectedCert.currentOwnerOrganization.toLowerCase());

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-white">
          Ownership Transfer Protocol
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Perform atomic ownership transfer between verified energy market counterparties.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Transfer Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded p-6 space-y-5">
            <h2 className="text-sm font-semibold text-white">
              Initiate Transfer
            </h2>

            {error && (
              <div className="p-3 bg-red-950/50 border border-red-800 rounded text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Transfer Rejected:</span> {error}
                </div>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-950/50 border border-emerald-800 rounded text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleTransfer} className="space-y-4 text-xs">
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

              {/* Real-time Certificate Status Card */}
              {selectedCert && (
                <div
                  className={`p-4 rounded border text-xs space-y-2 ${
                    isRetired
                      ? 'bg-red-950/20 border-red-800/80'
                      : 'bg-slate-950 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-white font-semibold">
                      {selectedCert.serialNumber}
                    </span>
                    <span
                      className={`font-mono text-[11px] font-bold ${
                        isRetired ? 'text-red-400' : 'text-emerald-400'
                      }`}
                    >
                      {selectedCert.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-slate-400">
                    <div>
                      <span>Current Owner:</span>{' '}
                      <span className="text-slate-200 font-medium">
                        {selectedCert.currentOwnerOrganization}
                      </span>
                    </div>
                    <div>
                      <span>Quantity:</span>{' '}
                      <span className="text-slate-200 font-mono font-medium tabular-nums">
                        {selectedCert.energyQuantityMWh} MWh ({selectedCert.energySource})
                      </span>
                    </div>
                  </div>

                  {isRetired && (
                    <div className="text-red-300 flex items-center gap-1.5 pt-1 text-[11px]">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>
                        Rule Invariant: Retired certificates are locked and cannot be transferred.
                      </span>
                    </div>
                  )}

                  {!isAuthorized && !isRetired && (
                    <div className="text-amber-300 flex items-center gap-1.5 pt-1 text-[11px]">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>
                        Notice: You are logged in as '{user?.organization}'. You cannot transfer this certificate unless you are the owner or a Registry Officer.
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">
                  New Owner Organization *
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newOwner}
                    onChange={(e) => setNewOwner(e.target.value)}
                    placeholder="e.g. EcoTech Industries Inc"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                    required
                  />

                  {/* Preset Counterparties */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[11px] text-slate-500">Suggested Counterparties:</span>
                    {['EcoTech Industries Inc', 'Boreas Wind Parks LLC', 'Helios Solar Energy Corp'].map(
                      (org) => (
                        <button
                          key={org}
                          type="button"
                          onClick={() => setNewOwner(org)}
                          className="px-2 py-0.5 text-[11px] bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded transition-colors whitespace-nowrap"
                        >
                          {org}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-medium">Transfer Reference / Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Bilateral OTC settlement contract #449"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || (isRetired ?? false)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-semibold rounded transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  {isSubmitting ? 'Validating Transfer...' : 'Execute Ownership Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Ownership Transfer History */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-400" />
                Transfer History Ledger
              </h2>
              {selectedCert && (
                <span className="font-mono text-xs text-slate-400">
                  {selectedCert.serialNumber}
                </span>
              )}
            </div>

            {loadingHistory ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Loading provenance ledger...
              </div>
            ) : history.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                {selectedCert
                  ? 'No prior transfers for this certificate. Still held by original issuing owner.'
                  : 'Select or enter a certificate serial number to inspect transfer history.'}
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((record, index) => (
                  <div
                    key={record.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>Hop #{history.length - index}</span>
                      <span className="tabular-nums">
                        {new Date(record.transferredAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-200">
                      <span className="text-slate-400">{record.previousOwner}</span>
                      <span className="text-emerald-400 font-bold">→</span>
                      <span className="font-semibold text-white">{record.newOwner}</span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
                      <span>Actor: {record.transferredBy}</span>
                      {record.notes && <span className="italic">{record.notes}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
