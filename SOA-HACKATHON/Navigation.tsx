import React from 'react';
import { 
  LayoutDashboard, 
  Award, 
  ArrowLeftRight, 
  ShieldCheck, 
  Archive, 
  Cpu, 
  PlayCircle, 
  BookOpen, 
  LogOut,
  UserCheck
} from 'lucide-react';
import { useAuth, DEMO_PRESETS } from '../context/AuthContext';

export type TabType = 
  | 'dashboard' 
  | 'certificates' 
  | 'ownership' 
  | 'retirement' 
  | 'registry' 
  | 'microservices' 
  | 'scenarios' 
  | 'architecture';

interface NavigationProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenAuthModal: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  onOpenAuthModal,
}) => {
  const { user, logout, switchDemoUser } = useAuth();

  const navItems: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'certificates', label: 'Certificates', icon: Award },
    { id: 'ownership', label: 'Transfer', icon: ArrowLeftRight },
    { id: 'retirement', label: 'Retire', icon: ShieldCheck },
    { id: 'registry', label: 'Retired Registry', icon: Archive },
    { id: 'microservices', label: 'SOA & Kafka', icon: Cpu },
    { id: 'scenarios', label: 'Demo Runner', icon: PlayCircle },
    { id: 'architecture', label: 'Architecture Docs', icon: BookOpen },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-900 sticky top-0 z-40 shadow-md">
      {/* Top Header Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center font-bold text-white text-base">
            Ω
          </div>
          <button
            onClick={() => setActiveTab('dashboard')}
            className="text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-emerald-400 transition-colors text-left"
          >
            Renewable Certificate Registry
          </button>
        </div>

        {/* User Identity & Logout Controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {user ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-200 whitespace-nowrap">
                  {user.username}
                </span>
                <span className="text-[11px] text-slate-400 whitespace-nowrap">
                  {user.organization} · <span className="text-emerald-400 font-mono">{user.role}</span>
                </span>
              </div>
              <button
                onClick={onOpenAuthModal}
                title="Switch User Role / Identity"
                className="px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Switch Role</span>
              </button>
              <button
                onClick={logout}
                title="Log Out and return to login screen"
                className="px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-red-400 hover:bg-slate-800 border border-slate-700 rounded transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
                <span>Log Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-4 py-2 text-xs font-medium text-white bg-emerald-600 rounded hover:bg-emerald-500 transition-colors whitespace-nowrap shrink-0"
            >
              Sign In
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation Tabs: Always visible across all screen sizes with horizontal scroll */}
      <div className="border-t border-slate-800 bg-slate-950/90 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 overflow-x-auto py-2">
          <nav className="flex items-center gap-1 sm:gap-2 shrink-0">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                    isActive
                      ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Role switch presets */}
          <div className="hidden xl:flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
            <span className="text-slate-500 mr-1">Identity:</span>
            {DEMO_PRESETS.map((p) => {
              const isSelected = user?.email === p.email;
              return (
                <button
                  key={p.key}
                  onClick={() => switchDemoUser(p.key)}
                  className={`px-2 py-0.5 rounded text-[10px] transition-colors whitespace-nowrap ${
                    isSelected
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 font-medium'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
};
