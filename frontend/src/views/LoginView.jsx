import React, { useState } from 'react';
import {
  Lock,
  User,
  ShieldCheck,
  Building2,
  CheckCircle2,
  ArrowRight,
  LogOut,
  KeyRound
} from 'lucide-react';

export default function LoginView({
  userRole = 'ADMIN',
  setUserRole,
  onLoginSuccess
}) {
  const [username, setUsername] = useState('admin@elogisol.com');
  const [password, setPassword] = useState('••••••••••••');
  const [roleSelect, setRoleSelect] = useState(userRole);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [msg, setMsg] = useState('');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setUserRole(roleSelect);
    setIsLoggedIn(true);
    setMsg(`Logged in successfully as ${roleSelect}!`);
    setTimeout(() => {
      setMsg('');
      if (onLoginSuccess) onLoginSuccess();
    }, 1200);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setMsg('You have been logged out.');
    setTimeout(() => setMsg(''), 2000);
  };

  return (
    <div className="max-w-xl mx-auto py-8 font-sans space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white mx-auto shadow-md">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold font-heading text-[rgb(25,40,57)] mt-2">
          1. Enterprise Authentication &amp; Login
        </h1>
        <p className="text-xs text-slate-500 font-sans">
          eLOGiFreight™ Multi-branch Forwarder Portal &bull; Role-Based Access Control (RBAC)
        </p>
      </div>

      {msg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          <span>{msg}</span>
        </div>
      )}

      {/* Card */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-5">
        {isLoggedIn ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                  {userRole.slice(0, 2)}
                </div>
                <div>
                  <div className="text-sm font-bold text-[rgb(25,40,57)]">{username}</div>
                  <div className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Active Session &bull; Role: <strong>{userRole}</strong></span>
                  </div>
                </div>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Online" />
            </div>

            <div className="space-y-2 text-xs">
              <label className="text-slate-600 font-medium block">Switch Working Persona / Role:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'ADMIN', label: 'Administrator', desc: 'Full System & Masters' },
                  { id: 'OPERATIONS', label: 'Operations Desk', desc: 'Fleet, GR & Rail Out' },
                  { id: 'COMMERCIAL', label: 'Commercial GM', desc: 'Billing & Approvals' }
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setUserRole(r.id);
                      setRoleSelect(r.id);
                      setMsg(`Active role switched to ${r.label}`);
                      setTimeout(() => setMsg(''), 2000);
                    }}
                    className={
                      'p-2.5 rounded-xl border text-left transition cursor-pointer ' +
                      (userRole === r.id
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 font-semibold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700')
                    }
                  >
                    <div className="text-xs font-bold">{r.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{r.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>

              <button
                onClick={onLoginSuccess}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
              >
                <span>Continue to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="text-slate-700 font-medium">Username / Corporate Email</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 font-medium">Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500 font-sans"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 font-medium">Select Branch / Role</label>
              <select
                value={roleSelect}
                onChange={(e) => setRoleSelect(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs focus:outline-none focus:border-blue-500 font-sans"
              >
                <option value="ADMIN">Administrator (Dadri ICD Head Office)</option>
                <option value="OPERATIONS">Operations Desk (Fleet &amp; Rail)</option>
                <option value="COMMERCIAL">Commercial Manager (Rate &amp; Billing)</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition cursor-pointer"
            >
              Sign In to eLOGiFreight
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
