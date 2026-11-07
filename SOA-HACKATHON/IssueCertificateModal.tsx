import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw, 
  Building, 
  Zap, 
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { EnergySource } from '../types';
import { certificateApi } from '../api';
import { useAuth } from '../context/AuthContext';

interface IssueCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const IssueCertificateModal: React.FC<IssueCertificateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user, switchDemoUser } = useAuth();

  const [serialNumber, setSerialNumber] = useState('');
  const [energySource, setEnergySource] = useState<EnergySource>('Solar');
  const [quantityMWh, setQuantityMWh] = useState('500');
  const [ownerOrg, setOwnerOrg] = useState('');
  const [facilityName, setFacilityName] = useState('Mojave Solar Array IV');
  const [gridRegion, setGridRegion] = useState('US-CAISO');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Generate a guaranteed unique serial number
  const generateSerial = (source: EnergySource = energySource) => {
    const yr = new Date().getFullYear();
    const rand = Math.floor(100 + Math.random() * 900);
    const generated = `REC-${yr}-${source.toUpperCase()}-${rand}`;
    setSerialNumber(generated);
  };

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSuccess(null);
      generateSerial(energySource);

      // Default owner organization based on logged-in user
      if (user?.role === 'certificateOwner' && user?.organization) {
        setOwnerOrg(user.organization);
      } else {
        setOwnerOrg('Helios Solar Energy Corp');
      }
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSourceChange = (newSource: EnergySource) => {
    setEnergySource(newSource);
    generateSerial(newSource);
    if (newSource === 'Solar') {
      setFacilityName('Mojave Solar Array IV');
      setGridRegion('US-CAISO');
    } else if (newSource === 'Wind') {
      setFacilityName('North Sea Wind Array B');
      setGridRegion('EU-NORDPOOL');
    } else if (newSource === 'Hydro') {
      setFacilityName('Columbia River Cascade 2');
      setGridRegion('US-BPA');
    } else if (newSource === 'Geothermal') {
      setFacilityName('Geysers Deep Plant 7');
      setGridRegion('US-CAISO');
    } else {
      setFacilityName('Midwest Biomass Plant');
      setGridRegion('US-MISO');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const cleanSerial = serialNumber.trim().toUpperCase();
    if (!cleanSerial) {
      setError('Certificate Serial Number is required');
      return;
    }

    if (Number(quantityMWh) <= 0) {
      setError('Energy quantity must be greater than zero MWh');
      return;
    }

    if (!ownerOrg.trim()) {
      setError('Owner Organization is required');
      return;
    }

    setSubmitting(true);
    try {
      const issued = await certificateApi.issue({
        serialNumber: cleanSerial,
        energySource,
        energyQuantityMWh: Number(quantityMWh),
        currentOwnerOrganization: ownerOrg.trim(),
        facilityName: facilityName.trim(),
        gridRegion: gridRegion.trim(),
        issueDate,
      });

      setSuccess(`Certificate ${issued.serialNumber} issued successfully!`);

      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10b981', '#06b6d4', '#f59e0b'],
        });
      } catch (e) {
        // ignore
      }

      onSuccess();
      setTimeout(() => {
        onClose();
        setSuccess(null);
      }, 1200);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Failed to issue certificate';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const isOfficer = user?.role === 'registryOfficer';

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-emerald-400" />
              Issue Renewable Energy Certificate
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Registers verified generation MWh with an immutable unique serial number.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Identity & Permission Banner */}
        <div
          className={`p-3 rounded text-xs flex items-center justify-between gap-3 border ${
            isOfficer
              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
              : 'bg-slate-950 border-slate-800 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-semibold text-white">
                {isOfficer ? 'Authority: Registry Officer' : `Facility: ${user?.organization || 'Owner'}`}
              </span>
              <div className="text-[11px] text-slate-400">
                {isOfficer
                  ? 'Permitted to issue certificates for any organization'
                  : 'Registering generation for your own organization'}
              </div>
            </div>
          </div>

          {!isOfficer && (
            <button
              type="button"
              onClick={async () => {
                await switchDemoUser('officer');
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] border border-slate-700 rounded transition-colors whitespace-nowrap flex items-center gap-1"
              title="Switch to Registry Officer to issue on behalf of other organizations"
            >
              <UserCheck className="w-3 h-3 text-emerald-400" />
              Switch to Officer
            </button>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800 rounded text-xs text-red-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Issuance Blocked:</span> {error}
            </div>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-950/50 border border-emerald-800 rounded text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Serial Number */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-medium">Serial Number *</label>
              <button
                type="button"
                onClick={() => generateSerial()}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono"
              >
                <RefreshCw className="w-3 h-3" />
                Auto-generate
              </button>
            </div>
            <input
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
              placeholder="e.g. REC-2026-SOLAR-101"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              required
            />
          </div>

          {/* Energy Source & Quantity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Energy Source *</label>
              <select
                value={energySource}
                onChange={(e) => handleSourceChange(e.target.value as EnergySource)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="Solar">Solar</option>
                <option value="Wind">Wind</option>
                <option value="Hydro">Hydro</option>
                <option value="Geothermal">Geothermal</option>
                <option value="Biomass">Biomass</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Quantity (MWh) *</label>
              <input
                type="number"
                value={quantityMWh}
                onChange={(e) => setQuantityMWh(e.target.value)}
                min="1"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 font-mono tabular-nums focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          {/* Owner Organization */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-medium">Initial Owner Organization *</label>
            <input
              type="text"
              value={ownerOrg}
              onChange={(e) => setOwnerOrg(e.target.value)}
              placeholder="e.g. Helios Solar Energy Corp"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-emerald-500"
              required
            />

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] text-slate-500">Presets:</span>
              {['Helios Solar Energy Corp', 'Boreas Wind Parks LLC', 'EcoTech Industries Inc'].map(
                (org) => (
                  <button
                    key={org}
                    type="button"
                    onClick={() => setOwnerOrg(org)}
                    className="px-2 py-0.5 text-[10px] bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded transition-colors whitespace-nowrap"
                  >
                    {org}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Facility & Region */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Generation Facility</label>
              <input
                type="text"
                value={facilityName}
                onChange={(e) => setFacilityName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Grid Interconnect</label>
              <input
                type="text"
                value={gridRegion}
                onChange={(e) => setGridRegion(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              {submitting ? 'Validating Serial & Issuing...' : 'Issue Certificate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
