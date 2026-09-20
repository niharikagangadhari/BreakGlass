import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useEmergencyRequests } from '../hooks/useEmergencyRequests';
import { emergencyAccessService } from '../services/emergencyAccess';
import { SessionCard } from '../components/SessionCard';
import { Modal } from '../components/Modal';
import { Clock, ShieldAlert, AlertTriangle, AlertOctagon, Info, CheckCircle2 } from 'lucide-react';
import { isOperatorOrAdmin } from '../utils/permissions';
import { useNavigate } from 'react-router-dom';

export function ActiveSessions() {
  const { user, role } = useAuth();
  const { activeSessions, refresh, loading } = useEmergencyRequests();
  const navigate = useNavigate();

  const [revokingSession, setRevokingSession] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleConfirmRevoke = async () => {
    if (!revokingSession) return;
    try {
      setSubmitting(true);
      setError('');
      // CALL SECURITY DEFINER RPC
      await emergencyAccessService.revokeEmergencyAccess(revokingSession.id);
      setSuccessMsg(`Emergency access for ${revokingSession.resource_name} has been revoked.`);
      setRevokingSession(null);
      await refresh();
    } catch (err) {
      console.error('Revocation failed:', err);
      setError(err.message || 'Failed to revoke emergency access session.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              Active Leases
            </span>
          </div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Active Emergency Access Sessions
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Real-time monitoring of granted emergency access leases. Access can be revoked manually or will automatically expire.
          </p>
        </div>

        <button
          onClick={() => navigate('/emergency-access')}
          className="rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-red-500 transition-colors border border-red-400/30"
        >
          Request New Access
        </button>
      </div>

      {/* Authoritative Notice */}
      <div className="rounded-xl border border-blue-900/40 bg-blue-950/20 p-4 flex items-start gap-3 text-xs text-blue-300">
        <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-blue-200 uppercase tracking-wide">
            Enterprise Security Notice:
          </span>
          <p className="mt-0.5 text-blue-300/80">
            The frontend countdown timer is purely a visual aid for operators. The PostgreSQL database expiration timestamp (<code className="text-blue-200 font-mono">expires_at</code>) is the sole authoritative source of truth and enforces access cut-off regardless of browser state.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 text-xs text-emerald-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-400 font-bold">✕</button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-xs text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-red-400 font-bold">✕</button>
        </div>
      )}

      {/* Session Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500">
          Syncing session leases with PostgreSQL database...
        </div>
      ) : activeSessions.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-slate-600" />
          <h3 className="mt-3 text-base font-bold text-white">
            No Active Emergency Sessions
          </h3>
          <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
            There are currently no active elevated access leases. All resources are secured under normal baseline privilege.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {activeSessions.map((session) => {
            const canRevoke = isOperatorOrAdmin(role) || session.user_id === user?.id;
            return (
              <SessionCard
                key={session.id}
                session={session}
                canRevoke={canRevoke}
                onRevoke={(s) => setRevokingSession(s)}
              />
            );
          })}
        </div>
      )}

      {/* Revocation Confirmation Modal */}
      <Modal
        isOpen={Boolean(revokingSession)}
        onClose={() => setRevokingSession(null)}
        title="Immediate Emergency Access Revocation"
        subtitle={`Session ID: ${revokingSession?.id?.substring(0, 8)}`}
      >
        <div className="space-y-4 text-xs text-slate-300">
          <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-3.5">
            <p className="text-slate-400">Target Protected Resource:</p>
            <p className="text-sm font-bold text-white mt-0.5">
              {revokingSession?.resource_name}
            </p>
            <p className="text-slate-400 mt-2">Active Lease Holder:</p>
            <p className="font-semibold text-slate-200">
              {revokingSession?.user_name || revokingSession?.user_email}
            </p>
          </div>

          <p className="text-slate-400 leading-relaxed">
            Revoking this session will immediately invalidate access across all microservices and append an <code className="text-red-400 font-mono">EMERGENCY_ACCESS_REVOKED</code> audit event.
          </p>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setRevokingSession(null)}
              className="rounded-lg border border-slate-700 px-3.5 py-2 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRevoke}
              disabled={submitting}
              className="rounded-lg bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-500 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              <AlertOctagon className="h-4 w-4" />
              <span>{submitting ? 'Revoking...' : 'Confirm Immediate Revocation'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
