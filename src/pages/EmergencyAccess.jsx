import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { emergencyAccessService } from '../services/emergencyAccess';
import { useAuth } from '../hooks/useAuth';
import {
  Flame,
  Clock,
  FileText,
  AlertOctagon,
  CheckCircle2,
  ArrowLeft,
  AlertTriangle,
  Lock,
  ShieldCheck,
  XCircle
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';

export function EmergencyAccess() {
  const [resources, setResources] = useState([]);
  const [selectedResourceId, setSelectedResourceId] = useState('');
  const [incidentName, setIncidentName] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [justification, setJustification] = useState('');
  const [duration, setDuration] = useState('15');
  const [loadingResources, setLoadingResources] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const navigate = useNavigate();
  const { role } = useAuth();

  // ============================================================
  // ADMIN ACCESS RESTRICTION
  // Administrators manage protected documents and approve
  // emergency requests. They do not submit emergency requests.
  // ============================================================

  if (role === 'admin') {
    return <Navigate to="/admin-dashboard" replace />;
  }

  // ============================================================
  // LOAD PROTECTED DOCUMENTS
  // ============================================================

  useEffect(() => {
    emergencyAccessService
      .getResources()
      .then(data => {
        setResources(data);

        if (data.length) {
          setSelectedResourceId(data[0].id);
        }
      })
      .catch(err =>
        setError(
          err.message || 'Failed to load protected documents.'
        )
      )
      .finally(() => setLoadingResources(false));
  }, []);

  const selectedResource = resources.find(
    r => r.id === selectedResourceId
  );

  // ============================================================
  // SUBMIT EMERGENCY ACCESS REQUEST
  // ============================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Defense-in-depth: prevent administrators from submitting
    // even if this handler is somehow triggered directly.
    if (role === 'admin') {
      setError(
        'Administrators cannot submit emergency access requests.'
      );
      return;
    }

    setError('');

    try {
      setSubmitting(true);

      const response =
        await emergencyAccessService.requestEmergencyAccess({
          resourceId: selectedResourceId,
          incidentName,
          incidentDescription,
          justification,
          durationMinutes: Number(duration)
        });

      setResult({
        ...response,
        resourceName:
          selectedResource?.name || 'Protected Document',
        duration
      });
    } catch (err) {
      setError(
        err.message ||
        'Failed to submit emergency access request.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ============================================================
  // RESET FORM
  // ============================================================

  const resetForm = () => {
    setResult(null);
    setIncidentName('');
    setIncidentDescription('');
    setJustification('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div className="flex items-center justify-between">

        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-red-400">
          <AlertOctagon className="h-4 w-4" />
          PROTOCOL: BREAK_GLASS_V2
        </div>

      </div>

      {/* ====================================================== */}
      {/* MAIN CARD */}
      {/* ====================================================== */}

      <div className="rounded-2xl border border-red-900/40 bg-[#0B132B] p-6 sm:p-8 shadow-2xl relative overflow-hidden">

        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-red-600" />

        {/* HEADER */}

        <div className="flex items-start gap-4">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-600/20 border border-red-500/40 text-red-500 shrink-0">
            <Flame className="h-7 w-7" />
          </div>

          <div>

            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              Emergency Document Access
            </h1>

            <p className="mt-1 text-xs text-slate-400">
              Offline incident-aware access to protected organizational documents.
            </p>

          </div>

        </div>

        {/* ==================================================== */}
        {/* REQUEST RESULT */}
        {/* ==================================================== */}

        {result ? (

          <div className="mt-8 space-y-5">

            <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-6 text-center">

              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />

              <h3 className="mt-3 text-xl font-bold text-white">
                Request Queued for Approval
              </h3>

              <div className="flex justify-center mt-3">
                <StatusBadge status="pending" />
              </div>

              <div className="mx-auto mt-5 max-w-md rounded-lg border border-slate-800 bg-slate-900/80 p-4 text-left text-xs space-y-2">

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Request ID
                  </span>

                  <span className="font-mono text-slate-300">
                    {result.requestId}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Document
                  </span>

                  <span className="font-semibold text-white">
                    {result.resourceName}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Relevance
                  </span>

                  <span className="font-mono font-bold text-emerald-400">
                    {result.relevance?.score ?? 0}%
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-500">
                    Duration
                  </span>

                  <span className="font-mono text-amber-400">
                    {result.duration} min
                  </span>
                </div>

              </div>

              <p className="mt-4 text-xs text-slate-400">
                An offline notification has been queued for
                authorized Operators/Admins.
              </p>

            </div>

            {/* RESULT ACTIONS */}

            <div className="flex justify-center gap-3">

              <button
                onClick={() => navigate('/dashboard')}
                className="rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-xs font-semibold text-white"
              >
                Go to Dashboard
              </button>

              <button
                onClick={resetForm}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white"
              >
                Submit Another Request
              </button>

            </div>

          </div>

        ) : (

          /* ================================================== */
          /* REQUEST FORM */
          /* ================================================== */

          <form
            onSubmit={handleSubmit}
            className="mt-8 space-y-6"
          >

            {/* ERROR */}

            {error && (
              <div className="flex items-start gap-2.5 rounded-lg border border-red-500/40 bg-red-500/10 p-3.5 text-xs text-red-300">

                <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />

                {error}

              </div>
            )}

            {/* OFFLINE ENGINE */}

            <div className="rounded-xl border border-emerald-900/40 bg-emerald-950/10 p-4">

              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">

                <ShieldCheck className="h-4 w-4" />

                OFFLINE AUTHORIZATION ENGINE

              </div>

              <p className="mt-1 text-[11px] text-slate-400">
                The incident/document relevance check runs locally.
                No external AI or internet connection is required.
              </p>

            </div>

            {/* ================================================= */}
            {/* INCIDENT NAME */}
            {/* ================================================= */}

            <div>

              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                1. Incident Name
              </label>

              <input
                type="text"
                value={incidentName}
                onChange={(e) =>
                  setIncidentName(e.target.value)
                }
                required
                placeholder="e.g. Database Server Failure"
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
              />

            </div>

            {/* ================================================= */}
            {/* INCIDENT DESCRIPTION */}
            {/* ================================================= */}

            <div>

              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                2. Incident Description
              </label>

              <textarea
                value={incidentDescription}
                onChange={e =>
                  setIncidentDescription(e.target.value)
                }
                required
                rows={3}
                placeholder="Describe what is happening, for example: Production database server has crashed and recovery is required."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
              />

            </div>

            {/* ================================================= */}
            {/* PROTECTED DOCUMENT */}
            {/* ================================================= */}

            <div>

              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                3. Required Protected Document
              </label>

              {loadingResources ? (

                <div className="py-3 text-xs text-slate-500">
                  Loading protected documents...
                </div>

              ) : (

                <>
                  <select
                    value={selectedResourceId}
                    onChange={e =>
                      setSelectedResourceId(e.target.value)
                    }
                    required
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white focus:border-red-500 focus:outline-none"
                  >

                    {resources.map(res => (
                      <option
                        key={res.id}
                        value={res.id}
                      >
                        {res.name} (
                        {res.sensitivity_level.toUpperCase()}
                        )
                      </option>
                    ))}

                  </select>

                  {selectedResource && (

                    <div className="mt-2 rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400">

                      <div className="flex items-center gap-2 font-semibold text-slate-300">

                        <Lock className="h-3.5 w-3.5" />

                        {selectedResource.category}
                        {' · '}
                        Emergency-only

                      </div>

                      <p className="mt-1">
                        {selectedResource.description}
                      </p>

                    </div>

                  )}

                </>

              )}

            </div>

            {/* ================================================= */}
            {/* JUSTIFICATION */}
            {/* ================================================= */}

            <div>

              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                4. Why is this document needed?
              </label>

              <textarea
                value={justification}
                onChange={e =>
                  setJustification(e.target.value)
                }
                required
                rows={3}
                placeholder="Explain why this document is necessary to resolve the incident."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
              />

            </div>

            {/* ================================================= */}
            {/* DURATION */}
            {/* ================================================= */}

            <div>

              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                5. Requested Access Duration
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">

                {['5', '15', '30', '60'].map(mins => (

                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDuration(mins)}
                    className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold ${duration === mins
                        ? 'border-red-500 bg-red-600/20 text-white'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400'
                      }`}
                  >

                    <Clock className="h-4 w-4" />

                    {mins} Minutes

                  </button>

                ))}

              </div>

            </div>

            {/* ================================================= */}
            {/* SUBMIT */}
            {/* ================================================= */}

            <div className="border-t border-slate-800/80 pt-6">

              <button
                type="submit"
                disabled={
                  submitting ||
                  loadingResources
                }
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-3.5 text-sm font-extrabold text-white disabled:opacity-50"
              >

                {submitting ? (

                  <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />

                ) : (

                  <>
                    <Flame className="h-5 w-5" />
                    TRANSMIT EMERGENCY REQUEST
                  </>

                )}

              </button>

              <p className="mt-3 text-center text-[11px] text-slate-500">
                All emergency requests enter the administrator
                queue and require review by an authorized administrator.
              </p>

            </div>

          </form>

        )}

      </div>

    </div>
  );
}