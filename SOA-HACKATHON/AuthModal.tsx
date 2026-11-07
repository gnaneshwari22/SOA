import React, { useState } from 'react';
import { X, Lock, User, Building, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuth, DEMO_PRESETS } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, login, register, switchDemoUser } = useAuth();

  const [mode, setMode] = useState<'switch' | 'login' | 'register'>('switch');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password');
  const [username, setUsername] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState<'certificateOwner' | 'registryOfficer'>('certificateOwner');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({ username, email, password, role, organization });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded max-w-md w-full p-6 space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            Registry Identity & Security Session
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            JWT-authenticated sessions with role-based and organization tenant boundaries.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex border-b border-slate-800 text-xs font-medium">
          <button
            onClick={() => { setMode('switch'); setError(null); }}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              mode === 'switch'
                ? 'border-emerald-400 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Quick Presets
          </button>
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              mode === 'login'
                ? 'border-emerald-400 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Custom Sign In
          </button>
          <button
            onClick={() => { setMode('register'); setError(null); }}
            className={`pb-2.5 px-3 border-b-2 transition-colors ${
              mode === 'register'
                ? 'border-emerald-400 text-emerald-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Register Org User
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800 rounded text-xs text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Mode 1: Quick Switch */}
        {mode === 'switch' && (
          <div className="space-y-2.5 text-xs">
            <span className="text-[11px] text-slate-500 font-medium uppercase tracking-wider block">
              SELECT DEMO ROLE PROFILE:
            </span>
            <div className="space-y-2">
              {DEMO_PRESETS.map((p) => {
                const isCurrent = user?.email === p.email;
                return (
                  <button
                    key={p.key}
                    onClick={async () => {
                      await switchDemoUser(p.key);
                      onClose();
                    }}
                    className={`w-full p-3 rounded text-left border transition-colors flex items-start justify-between gap-3 ${
                      isCurrent
                        ? 'bg-slate-950 border-emerald-500 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        {p.label}
                        {isCurrent && (
                          <span className="text-[10px] text-emerald-400 font-mono font-bold">
                            (CURRENT)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 font-mono">{p.email}</div>
                      <div className="text-[11px] text-slate-500 mt-1">{p.description}</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 whitespace-nowrap">
                      {p.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mode 2: Custom Sign In */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@registry.org"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In with JWT'}
            </button>
          </form>
        )}

        {/* Mode 3: Register */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. green_power_agent"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. trader@greenpower.com"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Organization Name</label>
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. Green Power Trading AG"
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400 font-medium">Assigned Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-emerald-500"
              >
                <option value="certificateOwner">certificateOwner (Own & Transfer)</option>
                <option value="registryOfficer">registryOfficer (Issue & Oversee)</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating Account...' : 'Register Organization Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
