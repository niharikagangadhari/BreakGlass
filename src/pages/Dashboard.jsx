import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEmergencyRequests } from '../hooks/useEmergencyRequests';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import { SessionCard } from '../components/SessionCard';
import { emergencyAccessService } from '../services/emergencyAccess';

import {
  ShieldAlert,
  Flame,
  Clock,
  CheckCircle2,
  FileCheck,
  Lock,
  ArrowRight,
  AlertTriangle,
  Layers,
  Key,
  ShieldCheck,
  ClipboardCheck,
  Activity,
} from 'lucide-react';

import {
  formatAuditDate,
  formatDuration,
} from '../utils/formatDate';

import { isOperatorOrAdmin } from '../utils/permissions';

export function Dashboard() {
  const { user, profile, role } = useAuth();

  const {
    requests,
    activeSessions,
    pendingRequests,
    loading,
    refresh,
  } = useEmergencyRequests();

  const navigate = useNavigate();

  const isAdmin = role === 'admin';
  const isPrivileged = isOperatorOrAdmin(role);

  // ------------------------------------------------------------
  // REVOKE ACTIVE SESSION
  // ------------------------------------------------------------

  const handleRevokeSession = async (session) => {
    try {
      await emergencyAccessService.revokeEmergencyAccess(session.id);
      await refresh();
    } catch (err) {
      alert(err.message || 'Failed to revoke session');
    }
  };

  return (
    <div className="space-y-8">

      {/* ====================================================== */}
      {/* TOP BANNER / WELCOME */}
      {/* ====================================================== */}

      <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900 via-[#0B132B] to-slate-900 p-6 shadow-xl relative overflow-hidden">

        <div className="flex flex-wrap items-center justify-between gap-4 z-10 relative">

          <div>

            <div className="flex items-center gap-2">

              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400" />

              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-400">
                Least Privilege Active
              </span>

            </div>

            {/* ADMIN TITLE */}
            {isAdmin ? (
              <>
                <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Security Operations Dashboard
                </h1>

                <p className="mt-1 text-xs sm:text-sm text-slate-400">
                  Monitor emergency access activity, review authorization
                  requests, and oversee temporary security elevations.
                </p>
              </>
            ) : (
              <>
                <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Emergency Access Console
                </h1>

                <p className="mt-1 text-xs sm:text-sm text-slate-400">
                  Operating under strict Row Level Security. All emergency
                  elevations require verified justification and peer authorization.
                </p>
              </>
            )}

          </div>


          {/* ================================================== */}
          {/* REQUEST BUTTON — USERS ONLY */}
          {/* ================================================== */}

          {!isAdmin && (
            <button
              onClick={() => navigate('/emergency-access')}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-3 text-sm font-extrabold text-white shadow-lg shadow-red-950/60 hover:from-red-500 hover:to-rose-500 border border-red-400/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Flame className="h-5 w-5 animate-pulse" />

              <span>
                REQUEST EMERGENCY ACCESS
              </span>
            </button>
          )}

          {/* ================================================== */}
          {/* ADMIN STATUS */}
          {/* ================================================== */}

          {isAdmin && (
            <div className="flex items-center gap-3 rounded-xl border border-purple-500/20 bg-purple-500/5 px-4 py-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20">
                <ShieldCheck className="h-4 w-4 text-purple-400" />
              </div>

              <div>
                <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">
                  Administrator
                </p>

                <p className="text-xs font-semibold text-slate-300">
                  Review & Authorization
                </p>
              </div>

            </div>
          )}

        </div>
      </div>


      {/* ====================================================== */}
      {/* EMERGENCY ACCESS POLICY */}
      {/* ====================================================== */}

      {isAdmin ? (

        /* ---------------------------------------------------- */
        /* ADMIN POLICY */
        /* ---------------------------------------------------- */

        <div className="rounded-xl border border-purple-900/40 bg-purple-950/20 p-4 sm:p-5">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <div className="flex items-start gap-3.5">

              <div className="rounded-lg bg-purple-600/20 p-2 text-purple-400 border border-purple-500/30 shrink-0">
                <ClipboardCheck className="h-5 w-5" />
              </div>

              <div>

                <h2 className="text-sm font-bold text-purple-200 uppercase tracking-wide">
                  Administrator Review Policy
                </h2>

                <p className="text-xs text-purple-300/80 mt-0.5 max-w-3xl">
                  Emergency access requests are reviewed and authorized
                  manually by privileged administrators. Approved access is
                  temporary, monitored, and recorded in the security audit trail.
                </p>

              </div>

            </div>

            {pendingRequests.length > 0 && (
              <button
                onClick={() => navigate('/admin')}
                className="text-xs font-bold text-purple-400 hover:text-purple-300 underline underline-offset-4 flex items-center gap-1 shrink-0"
              >
                <span>
                  Review Pending
                </span>

                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}

          </div>

        </div>

      ) : (

        /* ---------------------------------------------------- */
        /* NORMAL USER POLICY */
        /* ---------------------------------------------------- */

        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">

          <div className="flex items-start gap-3.5">

            <div className="rounded-lg bg-red-600/20 p-2 text-red-400 border border-red-500/30 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>

            <div>

              <h2 className="text-sm font-bold text-red-200 uppercase tracking-wide">
                Break-Glass Policy
              </h2>

              <p className="text-xs text-red-300/80 mt-0.5 max-w-2xl">
                "Emergency access is temporary, monitored, and fully audited."
                Every elevation event generates an immutable cryptographic
                audit record, triggering immediate security team notifications.
              </p>

            </div>

          </div>


          <button
            onClick={() => navigate('/emergency-access')}
            className="text-xs font-bold text-red-400 hover:text-red-300 underline underline-offset-4 flex items-center gap-1 shrink-0"
          >
            <span>
              Initiate Protocol
            </span>

            <ArrowRight className="h-3.5 w-3.5" />
          </button>

        </div>

      )}


      {/* ====================================================== */}
      {/* STATISTICS */}
      {/* ====================================================== */}

      <div>

        {isAdmin && (
          <div className="mb-3 flex items-center gap-2">

            <Activity className="h-4 w-4 text-slate-500" />

            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Security Overview
            </h2>

          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            title="Normal Access"
            value="ENFORCED"
            icon={Lock}
            description="Baseline RBAC active"
            variant="default"
          />

          <StatCard
            title="Active Sessions"
            value={activeSessions.length}
            icon={Clock}
            description="Live emergency leases"
            variant={
              activeSessions.length > 0
                ? 'emergency'
                : 'default'
            }
            badge={
              activeSessions.length > 0
                ? 'ACTIVE ELEVATION'
                : undefined
            }
          />

          <StatCard
            title="Pending Requests"
            value={pendingRequests.length}
            icon={AlertTriangle}
            description={
              isAdmin
                ? 'Awaiting administrator review'
                : 'Awaiting review'
            }
            variant={
              pendingRequests.length > 0
                ? 'warning'
                : 'default'
            }
          />

          <StatCard
            title="Audit Status"
            value="100% VERIFIED"
            icon={FileCheck}
            description="Postgres RLS immutable"
            variant="success"
          />

        </div>
      </div>


      {/* ====================================================== */}
      {/* ACTIVE SESSIONS */}
      {/* ====================================================== */}

      {activeSessions.length > 0 && (

        <div className="space-y-4">

          <div className="flex items-center justify-between">

            <div className="flex items-center gap-2">

              <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-ping" />

              <h2 className="text-lg font-bold text-white tracking-tight">
                Active Emergency Sessions ({activeSessions.length})
              </h2>

            </div>

            <button
              onClick={() => navigate('/active-sessions')}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
            >
              <span>
                View details & countdowns
              </span>

              <ArrowRight className="h-3.5 w-3.5" />
            </button>

          </div>


          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

            {activeSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onRevoke={handleRevokeSession}
                canRevoke={true}
              />
            ))}

          </div>

        </div>

      )}


      {/* ====================================================== */}
      {/* REQUEST HISTORY */}
      {/* ====================================================== */}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">

          <div>

            <div className="flex items-center gap-2">

              {isAdmin ? (
                <Layers className="h-4 w-4 text-purple-400" />
              ) : (
                <ShieldAlert className="h-4 w-4 text-slate-400" />
              )}

              <h2 className="text-base font-bold text-white tracking-tight">
                {isPrivileged
                  ? 'All Emergency Access Requests'
                  : 'Your Emergency Access History'}
              </h2>

            </div>

            <p className="text-xs text-slate-400 mt-1">

              {isPrivileged
                ? 'Historical record of emergency access requests and authorization lifecycle'
                : 'Historical log of your emergency access requests and approval lifecycle'}

            </p>

          </div>


          {/* ADMIN REVIEW BUTTON */}

          {isPrivileged && pendingRequests.length > 0 && (

            <button
              onClick={() => navigate('/admin')}
              className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-colors"
            >
              Review {pendingRequests.length} Pending
            </button>

          )}

        </div>


        <div className="mt-4 divide-y divide-slate-800/60">

          {/* LOADING */}

          {loading ? (

            <div className="py-8 text-center text-xs text-slate-500">
              Loading requests from secure store...
            </div>

          ) : requests.length === 0 ? (

            /* ================================================= */
            /* EMPTY STATE */
            /* ================================================= */

            <div className="py-10 text-center">

              {isAdmin ? (
                <>
                  <ShieldCheck className="mx-auto h-8 w-8 text-slate-600" />

                  <p className="mt-2 text-sm font-semibold text-slate-400">
                    No Emergency Requests on Record
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    Emergency access requests submitted by authorized
                    users will appear here for monitoring and review.
                  </p>
                </>
              ) : (
                <>
                  <ShieldAlert className="mx-auto h-8 w-8 text-slate-600" />

                  <p className="mt-2 text-sm font-semibold text-slate-400">
                    No emergency requests on record
                  </p>

                  <p className="text-xs text-slate-500 mt-1">
                    When critical production emergencies occur,
                    submit a request via the Break Glass protocol.
                  </p>
                </>
              )}

            </div>

          ) : (

            /* ================================================= */
            /* REQUEST LIST */
            /* ================================================= */

            requests.slice(0, 5).map((req) => (

              <div
                key={req.id}
                className="py-4 flex flex-wrap items-center justify-between gap-3"
              >

                <div className="space-y-1 min-w-0">

                  <div className="flex items-center gap-2">

                    <span className="font-mono text-xs font-bold text-white">
                      {req.resource_name || 'Resource'}
                    </span>

                    <span className="text-xs text-slate-500">
                      •
                    </span>

                    <span className="text-xs text-slate-400 font-mono">
                      {formatDuration(req.requested_duration)}
                    </span>


                    {req.sensitivity_level === 'critical' && (
                      <span className="rounded bg-red-500/20 px-1.5 py-0.2 text-[10px] font-bold text-red-400 border border-red-500/30">
                        CRITICAL
                      </span>
                    )}

                  </div>


                  <p className="text-xs text-slate-400 truncate max-w-xl">
                    "{req.justification}"
                  </p>


                  <p className="text-[10px] text-slate-500 font-mono">

                    Requested:{' '}
                    {formatAuditDate(req.requested_at)}

                    {' by '}

                    {req.user_name ||
                      req.user_email ||
                      'User'}

                  </p>

                </div>


                <div className="flex items-center gap-3">

                  <StatusBadge
                    status={req.status}
                  />

                </div>

              </div>

            ))

          )}

        </div>

      </div>

    </div>
  );
}