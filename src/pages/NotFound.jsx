import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 max-w-md w-full shadow-2xl">
        <div className="flex justify-center">
          <div className="rounded-full bg-red-500/10 p-4 border border-red-500/30 text-red-400">
            <ShieldAlert className="h-10 w-10" />
          </div>
        </div>

        <h1 className="mt-4 font-mono text-3xl font-extrabold text-white">
          404
        </h1>
        <h2 className="mt-1 text-sm font-bold uppercase tracking-wider text-slate-400">
          Resource Route Not Found
        </h2>
        <p className="mt-2 text-xs text-slate-500">
          The requested path is not a registered endpoint in the Break Glass security management matrix.
        </p>

        <button
          onClick={() => navigate('/dashboard')}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Return to Dashboard</span>
        </button>
      </div>
    </div>
  );
}
