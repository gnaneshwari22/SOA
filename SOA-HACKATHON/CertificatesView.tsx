import React, { useState } from 'react';
import { 
  Award, 
  Search, 
  Filter, 
  PlusCircle, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  Calendar,
  Building,
  MapPin,
  Zap,
  ArrowRight
} from 'lucide-react';
import { Certificate, EnergySource } from '../types';
import { certificateApi } from '../api';
import { useAuth } from '../context/AuthContext';

interface CertificatesViewProps {
  certificates: Certificate[];
  onRefresh: () => void;
  onOpenIssueModal: () => void;
  onSelectForTransfer?: (cert: Certificate) => void;
  onSelectForRetirement?: (cert: Certificate) => void;
}

export const CertificatesView: React.FC<CertificatesViewProps> = ({
  certificates,
  onRefresh,
  onOpenIssueModal,
  onSelectForTransfer,
  onSelectForRetirement,
}) => {
  const { user } = useAuth();

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCert, setSelectedCert] = useState<Certificate | null>(null);

  // Filter logic
  const filteredCertificates = certificates.filter((cert) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      cert.serialNumber.toLowerCase().includes(q) ||
      cert.currentOwnerOrganization.toLowerCase().includes(q) ||
      cert.facilityName.toLowerCase().includes(q) ||
      cert.gridRegion.toLowerCase().includes(q);

    const matchesSource = selectedSource === 'ALL' || cert.energySource === selectedSource;
    const matchesStatus = selectedStatus === 'ALL' || cert.status === selectedStatus;

    return matchesSearch && matchesSource && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Certificate Registry & Inventory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse registered renewable certificates, inspect provenance, and issue verified assets.
          </p>
        </div>

        <button
          onClick={onOpenIssueModal}
          className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          Issue New Certificate
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by serial number, owner organization, or facility..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
          />
        </div>

        {/* Filter Controls (Buttons/Segmented controls) */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded">
            <span className="text-slate-500 px-2 text-[11px]">Source:</span>
            {['ALL', 'Solar', 'Wind', 'Hydro', 'Geothermal'].map((src) => (
              <button
                key={src}
                onClick={() => setSelectedSource(src)}
                className={`px-2.5 py-1 rounded text-[11px] whitespace-nowrap transition-colors ${
                  selectedSource === src
                    ? 'bg-slate-800 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {src}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 border border-slate-800 rounded">
            <span className="text-slate-500 px-2 text-[11px]">Status:</span>
            {['ALL', 'ACTIVE', 'RETIRED'].map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 rounded text-[11px] whitespace-nowrap transition-colors ${
                  selectedStatus === st
                    ? 'bg-slate-800 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table of Certificates */}
      <div className="bg-slate-900 border border-slate-800 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">Serial Number</th>
                <th className="py-3 px-4">Energy Source</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4">Current Owner</th>
                <th className="py-3 px-4">Facility / Region</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCertificates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No certificates found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredCertificates.map((cert) => {
                  const isRetired = cert.status === 'RETIRED';
                  return (
                    <tr
                      key={cert.id}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => setSelectedCert(cert)}
                    >
                      <td className="py-3 px-4 font-mono font-medium text-slate-200">
                        {cert.serialNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {cert.energySource}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-white tabular-nums">
                        {cert.energyQuantityMWh} MWh
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {cert.currentOwnerOrganization}
                      </td>
                      <td className="py-3 px-4 text-slate-400">
                        {cert.facilityName} · {cert.gridRegion}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs font-semibold ${
                            isRetired ? 'text-slate-400' : 'text-emerald-400'
                          }`}
                        >
                          {cert.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div
                          className="flex items-center justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {!isRetired ? (
                            <>
                              {onSelectForTransfer && (
                                <button
                                  onClick={() => onSelectForTransfer(cert)}
                                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] rounded transition-colors whitespace-nowrap"
                                  title="Transfer Ownership"
                                >
                                  Transfer
                                </button>
                              )}
                              {onSelectForRetirement && (
                                <button
                                  onClick={() => onSelectForRetirement(cert)}
                                  className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 text-[11px] rounded transition-colors whitespace-nowrap"
                                  title="Retire against claim"
                                >
                                  Retire
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-500 font-mono">
                              LOCKED
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Certificate Details Drawer / Modal */}
      {selectedCert && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded max-w-xl w-full p-6 space-y-6 relative">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-mono">
                  Certificate Details
                </span>
                <h2 className="text-lg font-bold font-mono text-white mt-0.5">
                  {selectedCert.serialNumber}
                </h2>
              </div>
              <button
                onClick={() => setSelectedCert(null)}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-slate-500">Renewable Energy Source</span>
                <div className="text-white font-medium">{selectedCert.energySource}</div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500">Generation Quantity</span>
                <div className="text-white font-mono font-bold tabular-nums">
                  {selectedCert.energyQuantityMWh} MWh
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500">Current Owner Organization</span>
                <div className="text-emerald-400 font-medium">
                  {selectedCert.currentOwnerOrganization}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500">Issuing Authority</span>
                <div className="text-slate-300 font-medium">
                  {selectedCert.issuingOrganization}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500">Generation Facility</span>
                <div className="text-slate-300">{selectedCert.facilityName}</div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500">Grid Interconnect</span>
                <div className="text-slate-300 font-mono">{selectedCert.gridRegion}</div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500">Issue Date</span>
                <div className="text-slate-300 font-mono">{selectedCert.issueDate}</div>
              </div>
              <div className="space-y-1">
                <span className="text-slate-500">Registry Status</span>
                <div
                  className={`font-bold font-mono ${
                    selectedCert.status === 'RETIRED' ? 'text-slate-400' : 'text-emerald-400'
                  }`}
                >
                  {selectedCert.status}
                </div>
              </div>
            </div>

            {selectedCert.status === 'RETIRED' && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded text-xs text-slate-400 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p>
                  This certificate has been permanently retired against a renewable energy claim.
                  According to CO1 registry invariants, it cannot be transferred, edited, or retired again.
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedCert(null)}
                className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
