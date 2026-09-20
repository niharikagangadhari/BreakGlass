import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useEmergencyRequests } from '../hooks/useEmergencyRequests';
import { emergencyAccessService } from '../services/emergencyAccess';
import { isOperatorOrAdmin } from '../utils/permissions';
import { StatCard } from '../components/StatCard';
import { RequestCard } from '../components/RequestCard';
import { Modal } from '../components/Modal';

import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Lock,
  FileText,
  Activity,
  RefreshCw,
  UserCheck,
  ShieldAlert,
  Timer,
  ClipboardCheck,
  Ban,
} from 'lucide-react';

export function AdminDashboard() {
  const { role } = useAuth();

  const {
    requests,
    activeSessions,
    pendingRequests,
    refresh,
  } = useEmergencyRequests();

  const [approveModalReq, setApproveModalReq] = useState(null);
  const [rejectModalReq, setRejectModalReq] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Security Test 8 state
  const [securityTestResult, setSecurityTestResult] = useState(null);
  const [runningSecurityTest, setRunningSecurityTest] = useState(false);

  // ------------------------------------------------------------
  // ACCESS CONTROL
  // ------------------------------------------------------------

  if (!isOperatorOrAdmin(role)) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="w-full max-w-lg rounded-2xl border border-red-900/50 bg-red-950/20 p-8 text-center space-y-5">
          <div className="flex justify-center">
            <div className="rounded-full bg-red-600/20 p-4 border border-red-500/40 text-red-400">
              <Lock className="h-10 w-10" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              403 — Unauthorized Security Clearance
            </h2>

            <p className="mt-2 text-sm text-slate-400 leading-relaxed">
              The administrative control plane is restricted to Security
              Operators and System Administrators.
            </p>

            <p className="mt-2 text-xs text-slate-500">
              Current role:{' '}
              <code className="text-red-400 font-mono">
                {role}
              </code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------------------------
  // STATISTICS
  // ------------------------------------------------------------

  const approvedCount = requests.filter(
    (r) =>
      r.status === 'approved' ||
      (r.status === 'expired' && r.approved_at)
  ).length;

  const rejectedCount = requests.filter(
    (r) => r.status === 'rejected'
  ).length;

  // ------------------------------------------------------------
  // APPROVE REQUEST
  // ------------------------------------------------------------

  const handleConfirmApprove = async () => {
    if (!approveModalReq) return;

    try {
      setProcessing(true);
      setActionError('');
      setActionSuccess('');

      await emergencyAccessService.approveEmergencyAccess(
        approveModalReq.id
      );

      setActionSuccess(
        `Emergency access approved for ${approveModalReq.resource_name
        }.`
      );

      setApproveModalReq(null);

      await refresh();
    } catch (err) {
      console.error('Approval failed:', err);

      setActionError(
        err.message ||
        'Failed to approve emergency request.'
      );
    } finally {
      setProcessing(false);
    }
  };

  // ------------------------------------------------------------
  // REJECT REQUEST
  // ------------------------------------------------------------

  const handleConfirmReject = async () => {
    if (!rejectModalReq) return;

    if (
      !rejectionReason.trim() ||
      rejectionReason.trim().length < 3
    ) {
      setActionError(
        'A valid rejection reason (minimum 3 characters) is required.'
      );
      return;
    }

    try {
      setProcessing(true);
      setActionError('');
      setActionSuccess('');

      await emergencyAccessService.rejectEmergencyAccess(
        rejectModalReq.id,
        rejectionReason
      );

      setActionSuccess(
        `Emergency access request for ${rejectModalReq.resource_name
        } was rejected.`
      );

      setRejectModalReq(null);
      setRejectionReason('');

      await refresh();
    } catch (err) {
      console.error('Rejection failed:', err);

      setActionError(
        err.message ||
        'Failed to reject emergency request.'
      );
    } finally {
      setProcessing(false);
    }
  };

  // ------------------------------------------------------------
  // SECURITY TEST 8
  // ------------------------------------------------------------

  const handleRunSecurityRpcTest = async () => {
    if (pendingRequests.length === 0) {
      alert(
        'Please create a pending request first to test unauthorized RPC rejection.'
      );
      return;
    }

    const testTarget = pendingRequests[0];

    setRunningSecurityTest(true);
    setSecurityTestResult(null);

    try {
      const res =
        await emergencyAccessService.approveEmergencyAccess(
          testTarget.id
        );

      setSecurityTestResult({
        success: true,
        message:
          'Security warning: Operation succeeded because current session is elevated.',
        type: 'warning',
      });
    } catch (err) {
      setSecurityTestResult({
        success: false,
        message:
          `Security verification passed! RPC blocked execution: "${err.message}"`,
        type: 'success',
      });
    } finally {
      setRunningSecurityTest(false);
    }
  };

  // ------------------------------------------------------------
  // DASHBOARD
  // ------------------------------------------------------------

  return (
    <div className="space-y-7">

      {/* ====================================================== */}
      {/* ADMIN HEADER */}
      {/* ====================================================== */}

      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#101A35] via-[#0D162D] to-[#0A1022] p-6 sm:p-7">

        {/* Decorative glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-purple-600/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20">
                <ShieldCheck className="h-4 w-4 text-purple-400" />
              </div>

              <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-purple-400">
                Administrative Control Plane
              </span>
            </div>

            <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Security Operations Center
            </h1>

            <p className="mt-2 max-w-2xl text-xs sm:text-sm leading-relaxed text-slate-400">
              Review, authorize, and monitor temporary emergency
              access to protected organizational resources.
            </p>
          </div>

          {/* System status */}
          <div className="flex shrink-0 items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3">
            <div className="relative">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <div className="absolute inset-0 animate-ping rounded-full bg-emerald-400 opacity-40" />
            </div>

            <div>
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                System Status
              </p>

              <p className="text-xs font-semibold text-slate-300">
                Control Plane Operational
              </p>
            </div>
          </div>
        </div>
      </div>


      {/* ====================================================== */}
      {/* ADMIN RESPONSIBILITY */}
      {/* ====================================================== */}

      <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4 sm:p-5">
        <div className="flex items-start gap-3">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 border border-purple-500/20">
            <ClipboardCheck className="h-4 w-4 text-purple-400" />
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-bold text-purple-300">
                Administrator Review Mode
              </h3>

              <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider text-purple-400">
                ADMIN ONLY
              </span>
            </div>

            <p className="mt-1 text-xs leading-relaxed text-slate-400">
              Administrators manage protected resources and evaluate
              emergency access requests submitted by authorized users.
              This interface does not create emergency access requests.
            </p>
          </div>
        </div>
      </div>


      {/* ====================================================== */}
      {/* SUCCESS MESSAGE */}
      {/* ====================================================== */}

      {actionSuccess && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4">

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>

            <div>
              <p className="text-xs font-bold text-emerald-300">
                Action Completed
              </p>

              <p className="mt-0.5 text-xs text-emerald-400/80">
                {actionSuccess}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActionSuccess('')}
            className="text-slate-500 hover:text-white"
            aria-label="Dismiss success message"
          >
            ✕
          </button>
        </div>
      )}


      {/* ====================================================== */}
      {/* ERROR MESSAGE */}
      {/* ====================================================== */}

      {actionError && (
        <div className="flex items-start justify-between gap-4 rounded-xl border border-red-500/30 bg-red-950/20 p-4">

          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-red-500/10 p-2">
              <AlertTriangle className="h-4 w-4 text-red-400" />
            </div>

            <div>
              <p className="text-xs font-bold text-red-300">
                Operation Failed
              </p>

              <p className="mt-0.5 text-xs text-red-400/80">
                {actionError}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActionError('')}
            className="text-slate-500 hover:text-white"
            aria-label="Dismiss error message"
          >
            ✕
          </button>
        </div>
      )}


      {/* ====================================================== */}
      {/* SECURITY METRICS */}
      {/* ====================================================== */}

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Activity className="h-4 w-4 text-slate-500" />

          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Security Overview
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <StatCard
            title="Pending Requests"
            value={pendingRequests.length}
            icon={AlertTriangle}
            description={
              pendingRequests.length > 0
                ? 'Requires administrator review'
                : 'Queue is clear'
            }
            variant={
              pendingRequests.length > 0
                ? 'warning'
                : 'default'
            }
            badge={
              pendingRequests.length > 0
                ? 'ACTION REQUIRED'
                : undefined
            }
          />

          <StatCard
            title="Active Sessions"
            value={activeSessions.length}
            icon={Timer}
            description="Temporary access leases"
            variant={
              activeSessions.length > 0
                ? 'emergency'
                : 'default'
            }
          />

          <StatCard
            title="Approved Access"
            value={approvedCount}
            icon={UserCheck}
            description="Approved or expired leases"
            variant="success"
          />

          <StatCard
            title="Rejected Requests"
            value={rejectedCount}
            icon={Ban}
            description="Denied access requests"
            variant="default"
          />

        </div>
      </div>


      {/* ====================================================== */}
      {/* PENDING REQUEST QUEUE */}
      {/* ====================================================== */}

      <div className="space-y-4">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">
                Emergency Review Queue
              </h2>

              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-400">
                {pendingRequests.length}
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Requests awaiting human authorization.
            </p>
          </div>

          <button
            onClick={refresh}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-white"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh Queue
          </button>

        </div>


        {pendingRequests.length === 0 ? (

          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-12 text-center">

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/5">
              <ShieldCheck className="h-7 w-7 text-emerald-500/70" />
            </div>

            <h3 className="mt-4 text-sm font-bold text-slate-300">
              Review Queue Clear
            </h3>

            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">
              There are currently no emergency access requests
              waiting for administrative review.
            </p>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              No Action Required
            </div>

          </div>

        ) : (

          <div className="space-y-4">

            {pendingRequests.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                showActions={true}

                onApprove={(r) => {
                  setActionError('');
                  setActionSuccess('');
                  setApproveModalReq(r);
                }}

                onReject={(r) => {
                  setRejectModalReq(r);
                  setRejectionReason('');
                  setActionError('');
                  setActionSuccess('');
                }}
              />
            ))}

          </div>

        )}

      </div>


      {/* ====================================================== */}
      {/* ACTIVE SESSIONS */}
      {/* ====================================================== */}

      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 overflow-hidden">

        <div className="flex flex-col gap-2 border-b border-slate-800 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <Clock className="h-4 w-4 text-emerald-400" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-white">
                Active Access Sessions
              </h2>

              <p className="text-[11px] text-slate-500">
                Currently elevated temporary sessions
              </p>
            </div>
          </div>

          <span className="self-start rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-1 text-[10px] font-mono font-bold text-emerald-400 sm:self-auto">
            {activeSessions.length} ACTIVE
          </span>

        </div>

        {activeSessions.length === 0 ? (

          <div className="p-7 text-center">
            <Timer className="mx-auto h-7 w-7 text-slate-700" />

            <p className="mt-2 text-xs text-slate-500">
              No temporary access sessions are currently active.
            </p>
          </div>

        ) : (

          <div className="divide-y divide-slate-800/70">

            {activeSessions.map((session) => (
              <div
                key={session.id}
                className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
              >

                <div className="flex items-center gap-3">

                  <div className="rounded-lg bg-emerald-500/10 p-2">
                    <ShieldAlert className="h-4 w-4 text-emerald-400" />
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-white">
                      {session.resource_name ||
                        session.resourceName ||
                        'Protected Resource'}
                    </p>

                    <p className="mt-0.5 text-[10px] text-slate-500">
                      {session.user_name ||
                        session.user_email ||
                        'Authorized user'}
                    </p>
                  </div>

                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-emerald-400">
                  <Clock className="h-3 w-3" />
                  ACTIVE
                </div>

              </div>
            ))}

          </div>

        )}

      </div>


      {/* ====================================================== */}
      {/* SECURITY TEST */}
      {/* ====================================================== */}

      <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-start gap-3">

            <div className="rounded-lg bg-slate-800 p-2">
              <ShieldCheck className="h-4 w-4 text-slate-400" />
            </div>

            <div>
              <h3 className="text-sm font-bold text-white">
                Security Verification
              </h3>

              <p className="mt-1 max-w-xl text-xs leading-relaxed text-slate-500">
                Test the protected approval RPC and verify that
                unauthorized operations are rejected at the service layer.
              </p>
            </div>

          </div>

          <button
            onClick={handleRunSecurityRpcTest}
            disabled={
              runningSecurityTest ||
              pendingRequests.length === 0
            }
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/70 px-4 py-2.5 text-xs font-bold text-slate-300 transition-colors hover:bg-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShieldCheck className="h-3.5 w-3.5" />

            {runningSecurityTest
              ? 'Running Test...'
              : 'Run Security Test'}
          </button>

        </div>


        {securityTestResult && (
          <div
            className={`mt-4 rounded-lg border p-3 ${securityTestResult.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/5'
                : 'border-amber-500/30 bg-amber-500/5'
              }`}
          >
            <div className="flex items-start gap-2">

              {securityTestResult.type === 'success' ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-400" />
              )}

              <p
                className={`text-xs leading-relaxed ${securityTestResult.type === 'success'
                    ? 'text-emerald-300'
                    : 'text-amber-300'
                  }`}
              >
                {securityTestResult.message}
              </p>

            </div>
          </div>
        )}

      </div>


      {/* ====================================================== */}
      {/* APPROVE CONFIRMATION MODAL */}
      {/* ====================================================== */}

      <Modal
        isOpen={Boolean(approveModalReq)}
        onClose={() => {
          if (!processing) {
            setApproveModalReq(null);
          }
        }}
        title="Authorize Emergency Access"
        subtitle={`Request ID: ${approveModalReq?.id?.substring(0, 8)}`}
      >

        <div className="space-y-4 text-xs text-slate-300">

          <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4">

            <div className="flex items-start gap-3">

              <div className="rounded-lg bg-emerald-500/10 p-2">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              </div>

              <div className="min-w-0">

                <p className="font-semibold text-emerald-300">
                  Temporary privilege elevation
                </p>

                <p className="mt-2 text-sm font-bold text-white break-words">
                  {approveModalReq?.resource_name}
                </p>

                <div className="mt-2 space-y-1">

                  <p className="text-slate-400">
                    User:{' '}
                    <span className="text-slate-200">
                      {approveModalReq?.user_name ||
                        approveModalReq?.user_email}
                    </span>
                  </p>

                  <p className="text-slate-400">
                    Duration:{' '}
                    <span className="text-amber-400 font-mono font-bold">
                      {approveModalReq?.requested_duration} minutes
                    </span>
                  </p>

                  {approveModalReq?.incident_name && (
                    <p className="text-slate-400">
                      Incident:{' '}
                      <span className="text-slate-200">
                        {approveModalReq.incident_name}
                      </span>
                    </p>
                  )}

                </div>

              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
            <div className="flex items-start gap-2">
              <FileText className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />

              <p className="text-slate-400 leading-relaxed">
                Approval will grant temporary access to the protected
                resource and create an audit record for the authorization.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">

            <button
              onClick={() => setApproveModalReq(null)}
              disabled={processing}
              className="rounded-lg border border-slate-700 px-3.5 py-2 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirmApprove}
              disabled={processing}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 font-bold text-white hover:bg-emerald-500 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />

              {processing
                ? 'Authorizing...'
                : 'Confirm & Grant Access'}
            </button>

          </div>

        </div>

      </Modal>


      {/* ====================================================== */}
      {/* REJECT MODAL */}
      {/* ====================================================== */}

      <Modal
        isOpen={Boolean(rejectModalReq)}
        onClose={() => {
          if (!processing) {
            setRejectModalReq(null);
          }
        }}
        title="Reject Emergency Access"
        subtitle={`Request ID: ${rejectModalReq?.id?.substring(0, 8)}`}
      >

        <div className="space-y-4 text-xs text-slate-300">

          <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4">

            <div className="flex items-start gap-3">

              <div className="rounded-lg bg-red-500/10 p-2">
                <XCircle className="h-5 w-5 text-red-400" />
              </div>

              <div>

                <p className="font-semibold text-red-300">
                  Deny temporary access
                </p>

                <p className="mt-2 text-sm font-bold text-white">
                  {rejectModalReq?.resource_name}
                </p>

                <p className="mt-1 text-slate-400">
                  Requested by:{' '}
                  <span className="text-slate-200">
                    {rejectModalReq?.user_name ||
                      rejectModalReq?.user_email}
                  </span>
                </p>

                {rejectModalReq?.incident_name && (
                  <p className="mt-1 text-slate-400">
                    Incident:{' '}
                    <span className="text-slate-200">
                      {rejectModalReq.incident_name}
                    </span>
                  </p>
                )}

              </div>

            </div>
          </div>


          <div>

            <label className="mb-1.5 block font-semibold text-slate-300">
              Rejection Reason
            </label>

            <textarea
              rows={4}
              required
              value={rejectionReason}
              onChange={(e) =>
                setRejectionReason(e.target.value)
              }
              placeholder="Provide the security or compliance reason for denying this request..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3 text-xs leading-relaxed text-white placeholder-slate-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/30"
            />

            <p className="mt-1.5 text-[10px] text-slate-600">
              Minimum 3 characters required.
            </p>

          </div>


          <div className="flex justify-end gap-3 pt-2">

            <button
              onClick={() => setRejectModalReq(null)}
              disabled={processing}
              className="rounded-lg border border-slate-700 px-3.5 py-2 text-slate-300 hover:bg-slate-800 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirmReject}
              disabled={
                processing ||
                !rejectionReason.trim()
              }
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-500 transition-colors disabled:opacity-50"
            >
              <XCircle className="h-4 w-4" />

              {processing
                ? 'Rejecting...'
                : 'Confirm Rejection'}
            </button>

          </div>

        </div>

      </Modal>

    </div>
  );
}