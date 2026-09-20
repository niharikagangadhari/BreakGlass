import React from 'react';

export function StatCard({ title, value, icon: Icon, description, variant = 'default', badge }) {
  const variantStyles = {
    default: 'border-slate-800 bg-slate-900/60 text-slate-100',
    emergency: 'border-red-900/40 bg-red-950/20 text-red-400',
    warning: 'border-amber-900/40 bg-amber-950/20 text-amber-400',
    success: 'border-emerald-900/40 bg-emerald-950/20 text-emerald-400',
  };

  const iconBgStyles = {
    default: 'bg-slate-800/80 text-slate-300 border-slate-700',
    emergency: 'bg-red-900/40 text-red-400 border-red-700/50',
    warning: 'bg-amber-900/40 text-amber-400 border-amber-700/50',
    success: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50',
  };

  return (
    <div
      className={`relative rounded-xl border p-5 transition-all duration-200 hover:shadow-lg ${variantStyles[variant] || variantStyles.default}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            {title}
          </p>
          <h3 className="mt-2 text-3xl font-bold font-mono tracking-tight text-white">
            {value}
          </h3>
        </div>
        {Icon && (
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-lg border ${iconBgStyles[variant] || iconBgStyles.default}`}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {(description || badge) && (
        <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3 text-xs text-slate-400">
          <span>{description}</span>
          {badge && (
            <span className="font-semibold text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
