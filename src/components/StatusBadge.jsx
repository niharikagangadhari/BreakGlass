import React from 'react';

export function StatusBadge({ status }) {
  const normalized = (status || 'pending').toLowerCase();

  const config = {
    pending: {
      label: 'PENDING REVIEW',
      classes: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      dot: 'bg-amber-400 animate-pulse',
    },
    approved: {
      label: 'ACTIVE / APPROVED',
      classes: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      dot: 'bg-emerald-400',
    },
    rejected: {
      label: 'REJECTED',
      classes: 'bg-red-500/10 text-red-400 border-red-500/30',
      dot: 'bg-red-400',
    },
    revoked: {
      label: 'REVOKED',
      classes: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      dot: 'bg-rose-400',
    },
    expired: {
      label: 'EXPIRED',
      classes: 'bg-slate-500/10 text-slate-400 border-slate-600/30',
      dot: 'bg-slate-400',
    },
  };

  const current = config[normalized] || config.pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold tracking-wider uppercase border ${current.classes}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`}></span>
      {current.label}
    </span>
  );
}
