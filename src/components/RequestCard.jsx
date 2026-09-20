import React from 'react';
import { StatusBadge } from './StatusBadge';
import { formatAuditDate, formatRelativeTime, formatDuration } from '../utils/formatDate';
import { Shield, Clock, FileText, CheckCircle2, XCircle, AlertTriangle, Siren, Target } from 'lucide-react';

export function RequestCard({ request, onApprove, onReject, showActions = false }) {
  const isCritical = request.sensitivity_level === 'critical';

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm transition-all hover:border-slate-700">
      {/* Top Header: ID, Resource, Status */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-slate-400">
              REQ-{request.id.substring(0, 8)}
            </span>
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${isCritical
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
            >
              {request.sensitivity_level || 'high'}
            </span>
          </div>
          <h4 className="mt-1 text-base font-bold text-white flex items-center gap-2">
            <Shield className="h-4 w-4 text-slate-400" />
            {request.resource_name || 'Protected Resource'}
          </h4>
        </div>

        <StatusBadge status={request.status} />
      </div>

      {/* Body: Requester, Duration, Justification */}
      <div className="mt-4 space-y-3 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-slate-500">Requested by:</span>{' '}
            <span className="font-semibold text-slate-300">
              {request.user_name || request.user_email || 'Authorized User'}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Requested duration:</span>{' '}
            <span className="font-mono font-semibold text-amber-400">
              {formatDuration(request.requested_duration)}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Timestamp:</span>{' '}
            <span className="font-mono text-slate-400">
              {formatAuditDate(request.requested_at)}
            </span>
          </div>
          <div>
            <span className="text-slate-500">Relative:</span>{' '}
            <span className="text-slate-400">
              {formatRelativeTime(request.requested_at)}
            </span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3 text-xs space-y-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500 flex items-center gap-1.5"><Siren className="h-3.5 w-3.5" /> Incident</span>
            <span className="font-mono text-slate-300">{request.incident_name || 'N/A'}</span>
          </div>
          <p className="text-slate-300">{request.incident_description || 'No incident description provided.'}</p>
          {typeof request.relevance_score === 'number' && (
            <div className="flex items-center justify-between border-t border-slate-800 pt-2">
              <span className="text-slate-500 flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> Offline relevance</span>
              <span className={`font-mono font-bold ${request.relevance_score >= (request.relevance_threshold || 25) ? 'text-emerald-400' : 'text-red-400'}`}>{request.relevance_score}%</span>
            </div>
          )}
        </div>

        {/* Justification quote box */}
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-1">
            <FileText className="h-3.5 w-3.5 text-slate-500" />
            <span>Operational Justification</span>
          </div>
          <p className="text-xs leading-relaxed text-slate-300 italic whitespace-pre-wrap">
            "{request.justification}"
          </p>
        </div>

        {/* Rejection reason if rejected */}
        {request.status === 'rejected' && request.rejection_reason && (
          <div className="rounded-lg border border-red-900/30 bg-red-950/20 p-3 text-xs text-red-300">
            <span className="font-semibold text-red-400">Rejection Reason:</span>{' '}
            {request.rejection_reason}
          </div>
        )}
      </div>

      {/* Actions (Approve / Reject) for Admin/Operator */}
      {showActions && request.status === 'pending' && (
        <div className="mt-5 flex items-center justify-end gap-3 border-t border-slate-800/80 pt-4">
          <button
            onClick={() => onReject(request)}
            className="flex items-center gap-1.5 rounded-lg border border-red-800/60 bg-red-950/30 px-3.5 py-2 text-xs font-semibold text-red-400 hover:bg-red-900/40 hover:text-red-300 transition-colors"
          >
            <XCircle className="h-4 w-4" />
            <span>REJECT REQUEST</span>
          </button>

          <button
            onClick={() => onApprove(request)}
            className="flex items-center gap-1.5 rounded-lg border border-emerald-600/60 bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-950/40 hover:bg-emerald-500 transition-colors"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>APPROVE EMERGENCY ACCESS</span>
          </button>
        </div>
      )}
    </div>
  );
}
