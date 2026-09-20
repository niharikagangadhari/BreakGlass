import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ShieldAlert, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, KeyRound, UserCheck } from 'lucide-react';
import { isConfigured } from '../services/supabase';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setSubmitting(true);
      if (isRegistering) {
        if (!fullName.trim()) {
          setError('Please provide your full name.');
          setSubmitting(false);
          return;
        }
        await register(email, password, fullName);
        setSuccessMsg('Account registered successfully. You can now sign in.');
        setIsRegistering(false);
      } else {
        await login(email, password);
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick helper for easy test switching between roles
  const handleQuickFill = (testEmail, testPass) => {
    setEmail(testEmail);
    setPassword(testPass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#070C1E] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        {/* Enterprise Shield Logo */}
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-xl shadow-red-950/60 border border-red-500/40">
            <ShieldAlert className="h-9 w-9" />
          </div>
        </div>

        <h1 className="mt-5 text-center text-3xl font-extrabold tracking-tight text-white font-mono">
          BREAK GLASS
        </h1>
        <p className="mt-1 text-center text-xs font-semibold tracking-widest text-slate-400 uppercase">
          Emergency Access Management System
        </p>

        {!isConfigured && (
          <div className="mt-4 rounded-lg border border-blue-900/50 bg-blue-950/30 p-3 text-center text-xs text-blue-300">
            <span className="font-semibold text-blue-200">Offline Simulation Active:</span> Pre-seeded with 
            Normal User, Security Operator, and Admin test accounts below.
          </div>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-[#0B132B] py-8 px-6 shadow-2xl rounded-2xl border border-slate-800/80 sm:px-10">
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Officer Jane Doe"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/90 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Security Identity (Email)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@breakglass.internal"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/90 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                Authentication Secret (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-500" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/90 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full flex justify-center items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-950/40 hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isRegistering ? 'CREATE ACCOUNT' : 'AUTHENTICATE & SIGN IN'}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 border-t border-slate-800 pt-4 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
                setSuccessMsg('');
              }}
              className="text-xs font-medium text-slate-400 hover:text-red-400 transition-colors"
            >
              {isRegistering
                ? 'Already have credentials? Sign in here'
                : 'Need to register a new user? Register here'}
            </button>
          </div>

          {/* Quick Demo Test Profiles Switcher */}
          <div className="mt-6 border-t border-slate-800/80 pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center mb-3">
              Quick Test Accounts
            </p>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('user@breakglass.internal', 'password123')}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-300 hover:border-slate-700 hover:bg-slate-800/80 transition-all text-left"
              >
                <div>
                  <span className="font-semibold block text-white">Normal User (David Lightman)</span>
                  <span className="text-[10px] text-slate-400">role: user (cannot approve)</span>
                </div>
                <span className="text-[10px] rounded bg-slate-800 px-1.5 py-0.5 font-mono text-slate-300 border border-slate-700">
                  Select
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('admin@breakglass.internal', 'password123')}
                className="flex items-center justify-between rounded-lg border border-purple-900/40 bg-purple-950/20 px-3 py-2 text-xs text-purple-200 hover:border-purple-700 hover:bg-purple-900/30 transition-all text-left"
              >
                <div>
                  <span className="font-semibold block text-white">Administrator (Dr. Connor)</span>
                  <span className="text-[10px] text-purple-300">role: admin (full controls)</span>
                </div>
                <span className="text-[10px] rounded bg-purple-900/60 px-1.5 py-0.5 font-mono text-purple-200 border border-purple-700">
                  Select
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('operator@breakglass.internal', 'password123')}
                className="flex items-center justify-between rounded-lg border border-blue-900/40 bg-blue-950/20 px-3 py-2 text-xs text-blue-200 hover:border-blue-700 hover:bg-blue-900/30 transition-all text-left"
              >
                <div>
                  <span className="font-semibold block text-white">Security Operator (Alex Vance)</span>
                  <span className="text-[10px] text-blue-300">role: operator (approve / reject)</span>
                </div>
                <span className="text-[10px] rounded bg-blue-900/60 px-1.5 py-0.5 font-mono text-blue-200 border border-blue-700">
                  Select
                </span>
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-500">
          All access attempts are cryptographically verified and recorded in the permanent audit trail.
        </p>
      </div>
    </div>
  );
}
