import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { auditService } from '../services/audit';
import { emergencyAccessService } from '../services/emergencyAccess';
import { formatAuditDate } from '../utils/formatDate';
import { isOperatorOrAdmin } from '../utils/permissions';
import { 
  ScrollText, 
  Search, 
  Filter, 
  ShieldAlert, 
  FileCode, 
  Calendar,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Clock,
  Flame
} from 'lucide-react';

export function AuditLogs() {
  const { user, role } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resources, setResources] = useState([]);

  // Filters
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetails, setSelectedDetails] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await auditService.getAuditLogs({
        action: actionFilter || undefined,
        resource_id: resourceFilter || undefined,
        search: searchQuery || undefined,
      });
      setLogs(data);
    } catch (err) {
      console.error('Failed to fetch audit trail:', err);
      setError(err.message || 'Failed to retrieve audit trail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await emergencyAccessService.getResources();
        setResources(res);
      } catch (err) {
        console.error('Failed to load resources for filter:', err);
      }
    }
    loadMeta();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, resourceFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'EMERGENCY_ACCESS_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-mono font-semibold text-amber-400 border border-amber-500/30">
            <Flame className="h-3 w-3" />
            REQUESTED
          </span>
        );
      case 'EMERGENCY_ACCESS_APPROVED':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-mono font-semibold text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3" />
            APPROVED
          </span>
        );
      case 'EMERGENCY_ACCESS_REJECTED':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-2 py-0.5 text-xs font-mono font-semibold text-red-400 border border-red-500/30">
            <XCircle className="h-3 w-3" />
            REJECTED
          </span>
        );
      case 'EMERGENCY_ACCESS_REVOKED':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-2 py-0.5 text-xs font-mono font-semibold text-rose-400 border border-rose-500/30">
            <AlertOctagon className="h-3 w-3" />
            REVOKED
          </span>
        );
      case 'EMERGENCY_ACCESS_EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-slate-500/10 px-2 py-0.5 text-xs font-mono font-semibold text-slate-400 border border-slate-600/30">
            <Clock className="h-3 w-3" />
            EXPIRED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-xs font-mono font-semibold text-slate-300 border border-slate-700">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <ScrollText className="h-5 w-5 text-slate-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              Forensic Log Trail
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Immutable Audit Trail
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Cryptographically sealed record of all access requests, authorizations, revocations, and system expirations.
          </p>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/80 px-3.5 py-1.5 text-xs text-slate-400 font-mono">
          Scope: <span className="font-bold text-white">{isOperatorOrAdmin(role) ? 'Enterprise Global' : 'Account Confined (RLS)'}</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3">
          {/* Text Search */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search user, request ID, resource, or action..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 pl-9 pr-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
            />
          </div>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
          >
            <option value="">All Audit Actions</option>
            <option value="EMERGENCY_ACCESS_REQUESTED">EMERGENCY_ACCESS_REQUESTED</option>
            <option value="EMERGENCY_ACCESS_APPROVED">EMERGENCY_ACCESS_APPROVED</option>
            <option value="EMERGENCY_ACCESS_REJECTED">EMERGENCY_ACCESS_REJECTED</option>
            <option value="EMERGENCY_ACCESS_REVOKED">EMERGENCY_ACCESS_REVOKED</option>
            <option value="EMERGENCY_ACCESS_EXPIRED">EMERGENCY_ACCESS_EXPIRED</option>
          </select>

          {/* Resource Filter */}
          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-red-500 focus:outline-none"
          >
            <option value="">All Protected Resources</option>
            {resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700 transition-colors"
          >
            Filter Logs
          </button>
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#070C1E] text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Timestamp (UTC)</th>
                <th className="px-4 py-3.5">Security Action</th>
                <th className="px-4 py-3.5">Target Resource</th>
                <th className="px-4 py-3.5">Actor / User</th>
                <th className="px-4 py-3.5">Request Reference</th>
                <th className="px-4 py-3.5 text-right">Details Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-slate-500 font-sans">
                    Loading cryptographic audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-4 py-10 text-center text-slate-500 font-sans">
                    No matching audit logs found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-slate-400 whitespace-nowrap">
                      {formatAuditDate(log.created_at)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="px-4 py-3 font-sans font-medium text-white max-w-[200px] truncate">
                      {log.resource_name || log.resource_id || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-sans">
                      {log.user_name || log.user_email || log.user_id?.substring(0, 8) || 'System'}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {log.emergency_request_id ? `REQ-${log.emergency_request_id.substring(0, 8)}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {log.details ? (
                        <button
                          onClick={() => setSelectedDetails(log)}
                          className="rounded bg-slate-800 px-2.5 py-1 text-[11px] font-sans font-semibold text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700"
                        >
                          Inspect JSON
                        </button>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* JSON Payload Inspector Drawer/Modal */}
      {selectedDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-mono">
                  {selectedDetails.action}
                </h3>
                <p className="text-xs text-slate-400">
                  Log ID: {selectedDetails.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedDetails(null)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <pre className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs font-mono text-emerald-400 overflow-x-auto max-h-72">
                {JSON.stringify(selectedDetails.details, null, 2)}
              </pre>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedDetails(null)}
                className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
              >
                Close Payload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
