import React, { useState } from 'react';
import { 
  Lock, 
  User, 
  Building, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  KeyRound, 
  Award,
  Zap
} from 'lucide-react';
import { useAuth, DEMO_PRESETS } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth();

  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password');
  const [username, setUsername] = useState('');
  const [organization, setOrganization] = useState('');
  const [role, setRole] = useState<'certificateOwner' | 'registryOfficer'>('registryOfficer');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password.trim());
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Authentication failed. Please verify credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim() || !email.trim() || !password.trim() || !organization.trim()) {
      setError('All fields are required.');
      return;
    }

    setLoading(true);
    try {
      await register({
        username: username.trim(),
        email: email.trim(),
        password: password.trim(),
        organization: organization.trim(),
        role,
      });
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Registration failed. Email might already exist.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fillPreset = (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword('password');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-emerald-500/20 selection:text-emerald-300">
      <div className="max-w-md w-full mx-auto space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex w-12 h-12 rounded bg-emerald-600 items-center justify-center font-bold text-white text-2xl shadow-lg shadow-emerald-950/50">
            Ω
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Renewable Certificate Registry
          </h1>
          <p className="text-xs text-slate-400">
            SOA Programming & Microservices — Team 17
          </p>
          <div className="text-[11px] text-emerald-400 font-mono pt-1">
            Sign in with credentials to access registry operations
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900 border border-slate-800 rounded p-6 sm:p-8 space-y-6 shadow-xl">
          {/* Tab Switcher: Login vs Register */}
          <div className="flex border-b border-slate-800 text-xs font-semibold">
            <button
              onClick={() => { setIsRegisterMode(false); setError(null); }}
              className={`flex-1 pb-3 text-center border-b-2 transition-colors ${
                !isRegisterMode
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In (JWT Login)
            </button>
            <button
              onClick={() => { setIsRegisterMode(true); setError(null); }}
              className={`flex-1 pb-3 text-center border-b-2 transition-colors ${
                isRegisterMode
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Register Organization
            </button>
          </div>

          {error && (
            <div className="p-3 bg-red-950/50 border border-red-800 rounded text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!isRegisterMode ? (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. officer@registry.org"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-medium">Password</label>
                  <span className="text-[11px] text-slate-500 font-mono">default: password</span>
                </div>
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
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded transition-colors flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                {loading ? 'Authenticating with Gateway...' : 'Sign In with Credentials'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. energy_trader_1"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Official Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="trader@cleanenergy.com"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Organization Legal Name</label>
                <input
                  type="text"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  placeholder="e.g. Apex Wind Power Inc"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Requested Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-100 focus:outline-none focus:border-emerald-500"
                >
                  <option value="registryOfficer">registryOfficer (Can Issue &amp; Oversee Registry)</option>
                  <option value="certificateOwner">certificateOwner (Own, Trade &amp; Retire)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded transition-colors mt-2"
              >
                {loading ? 'Registering Account...' : 'Create Account & Sign In'}
              </button>
            </form>
          )}

          {/* Quick-fill Preset Credentials Section */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
              <span>Quick-Fill Seed Credentials:</span>
              <span className="text-slate-500 font-mono">Password: password</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {DEMO_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => fillPreset(preset.email)}
                  className="p-2.5 bg-slate-950 hover:bg-slate-800 text-left border border-slate-800 hover:border-emerald-500/50 rounded transition-colors"
                >
                  <div className="font-semibold text-white text-[11px] flex items-center justify-between">
                    <span>{preset.label}</span>
                    <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-slate-900 text-emerald-400">
                      {preset.role === 'registryOfficer' ? 'Officer' : 'Owner'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                    {preset.email}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security & Invariant Note */}
        <div className="text-center text-[11px] text-slate-500">
          Protected by BCrypt Password Hashing &amp; Signed JWT Authorization at the Gateway.
        </div>
      </div>
    </div>
  );
};
