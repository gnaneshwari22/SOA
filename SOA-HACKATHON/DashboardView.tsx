import React from 'react';
import { 
  Award, 
  ShieldCheck, 
  ArrowLeftRight, 
  Zap, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  ExternalLink 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { Certificate, OwnershipTransfer, RetirementRecord, AuditLogEntry } from '../types';
import { TabType } from './Navigation';

interface DashboardViewProps {
  certificates: Certificate[];
  transfers: OwnershipTransfer[];
  retirements: RetirementRecord[];
  auditLogs: AuditLogEntry[];
  setActiveTab: (tab: TabType) => void;
  onOpenIssueModal: () => void;
}

const SOURCE_COLORS: Record<string, string> = {
  Solar: '#f59e0b',
  Wind: '#06b6d4',
  Hydro: '#3b82f6',
  Geothermal: '#ec4899',
  Biomass: '#10b981',
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  certificates,
  transfers,
  retirements,
  auditLogs,
  setActiveTab,
  onOpenIssueModal,
}) => {
  const totalCertificates = certificates.length;
  const activeCertificates = certificates.filter((c) => c.status === 'ACTIVE').length;
  const retiredCertificates = certificates.filter((c) => c.status === 'RETIRED').length;
  const totalMWh = certificates.reduce((sum, c) => sum + c.energyQuantityMWh, 0);
  const retiredMWh = retirements.reduce((sum, r) => sum + r.energyQuantityMWh, 0);

  // Group energy sources for pie chart
  const energyBySource = certificates.reduce((acc, c) => {
    acc[c.energySource] = (acc[c.energySource] || 0) + c.energyQuantityMWh;
    return acc;
  }, {} as Record<string, number>);

  const sourceData = Object.entries(energyBySource).map(([name, value]) => ({
    name,
    value,
  }));

  // Status breakdown
  const statusData = [
    { name: 'Active', value: activeCertificates, color: '#10b981' },
    { name: 'Retired', value: retiredCertificates, color: '#64748b' },
  ];

  // Generation by source bar data
  const barData = Object.entries(energyBySource).map(([source, mwh]) => ({
    source,
    MWh: mwh,
  }));

  return (
    <div className="space-y-8">
      {/* Top Welcome & Mechanism-to-Outcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Renewable Energy Certificate Registry
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Preventing duplicate claims and double counting through microservices and immutable retirement events.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenIssueModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            Issue Certificate
          </button>
          <button
            onClick={() => setActiveTab('retirement')}
            className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Retire Claim
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (Tabular Numerals & High Density) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total Registered</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white tabular-nums font-mono">
              {totalCertificates}
            </span>
            <span className="text-xs text-slate-500">certificates</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 tabular-nums">
            {totalMWh.toLocaleString()} MWh total generation
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active & Tradable</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-emerald-400 tabular-nums font-mono">
              {activeCertificates}
            </span>
            <span className="text-xs text-slate-500">available</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 tabular-nums">
            {(totalMWh - retiredMWh).toLocaleString()} MWh circulating supply
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Permanently Retired</span>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-300 tabular-nums font-mono">
              {retiredCertificates}
            </span>
            <span className="text-xs text-slate-500">claims</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 tabular-nums">
            {retiredMWh.toLocaleString()} MWh retired against claims
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Ownership Transfers</span>
            <ArrowLeftRight className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-white tabular-nums font-mono">
              {transfers.length}
            </span>
            <span className="text-xs text-slate-500">recorded</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Audit-logged cross-organization transfers
          </div>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Generation by Energy Source */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              Megawatt-Hours by Energy Source
            </h2>
            <span className="text-xs text-slate-500 tabular-nums">Unit: MWh</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="source" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 4, color: '#f8fafc' }}
                  formatter={(val: any) => [`${val} MWh`, 'Energy Quantity']}
                />
                <Bar dataKey="MWh" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Certificate Status Breakdown */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded space-y-4">
          <h2 className="text-sm font-semibold text-white">
            Registry Status Distribution
          </h2>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 4, color: '#f8fafc' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 border-t border-slate-800 pt-3 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block" />
                Active (Tradable)
              </span>
              <span className="font-mono tabular-nums font-semibold">{activeCertificates}</span>
            </div>
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-slate-500 inline-block" />
                Retired (Locked)
              </span>
              <span className="font-mono tabular-nums font-semibold">{retiredCertificates}</span>
            </div>
          </div>
        </div>
      </div>

      {/* High-Density Dual Section: Active Inventory & Recent Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Certificates Inventory */}
        <div className="bg-slate-900 border border-slate-800 rounded p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              Active Certificates Ready for Transfer or Retirement
            </h2>
            <button
              onClick={() => setActiveTab('certificates')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              View all
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/80">
            {certificates
              .filter((c) => c.status === 'ACTIVE')
              .slice(0, 4)
              .map((cert) => (
                <div key={cert.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-slate-200 text-sm">
                        {cert.serialNumber}
                      </span>
                      <span className="text-slate-500 text-xs">·</span>
                      <span className="text-xs text-slate-400 font-medium">
                        {cert.energySource}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Owner: <span className="text-slate-400">{cert.currentOwnerOrganization}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-mono font-bold text-white tabular-nums">
                      {cert.energyQuantityMWh} MWh
                    </div>
                    <div className="text-[11px] text-emerald-400 font-medium">
                      Active
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Real-time System Audit Ledger */}
        <div className="bg-slate-900 border border-slate-800 rounded p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">
              Recent System & Event Activity
            </h2>
            <button
              onClick={() => setActiveTab('microservices')}
              className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              Kafka Stream
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-800/80 max-h-80 overflow-y-auto pr-1">
            {auditLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="py-2.5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-slate-300 font-medium">
                    {log.action}
                  </span>
                  <span className="text-slate-500 font-mono text-[11px] tabular-nums">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-slate-400 line-clamp-1">{log.details}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span>Actor: {log.actor}</span>
                  <span>·</span>
                  <span
                    className={
                      log.status === 'SUCCESS'
                        ? 'text-emerald-400'
                        : log.status === 'REJECTED'
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }
                  >
                    {log.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
