import React, { useEffect, useState } from 'react';
import {
  Shield,
  Clock,
  User,
  FileText,
  X,
  Lock,
  AlertTriangle
} from 'lucide-react';

import { emergencyAccessService } from '../services/emergencyAccess';


// ---------------------------------------------------------
// Local helper functions
// ---------------------------------------------------------

const formatDateTime = (date) => {
  if (!date) return '—';

  try {
    return new Date(date).toLocaleString();
  } catch {
    return '—';
  }
};


const getRemainingSeconds = (expiresAt) => {
  if (!expiresAt) return 0;

  const expirationTime = new Date(expiresAt).getTime();

  if (Number.isNaN(expirationTime)) {
    return 0;
  }

  const remaining = Math.floor(
    (expirationTime - Date.now()) / 1000
  );

  return Math.max(0, remaining);
};


// ---------------------------------------------------------
// Session Card
// ---------------------------------------------------------

export default function SessionCard({
  session,
  onRevoke,
  canRevoke = true
}) {
  const [secondsLeft, setSecondsLeft] = useState(
    getRemainingSeconds(session.expires_at)
  );

  const [openingDocument, setOpeningDocument] = useState(false);
  const [documentData, setDocumentData] = useState(null);
  const [documentError, setDocumentError] = useState('');
  const [documentLocked, setDocumentLocked] = useState(false);


  // -------------------------------------------------------
  // Countdown + automatic expiration lock
  // -------------------------------------------------------

  useEffect(() => {
    const updateCountdown = () => {
      const remaining = getRemainingSeconds(
        session.expires_at
      );

      setSecondsLeft(remaining);

      /*
       * When the session expires:
       *
       * 1. Remove the document from memory
       * 2. Lock the document viewer
       * 3. Stop any loading state
       */
      if (remaining <= 0) {
        setDocumentData(null);
        setDocumentLocked(true);
        setOpeningDocument(false);
      }
    };

    updateCountdown();

    const interval = setInterval(
      updateCountdown,
      1000
    );

    return () => {
      clearInterval(interval);
    };
  }, [session.expires_at]);


  // -------------------------------------------------------
  // Additional protection:
  // Check whether the document is still valid while open.
  // -------------------------------------------------------

  useEffect(() => {
    if (!documentData) {
      return;
    }

    const checkDocumentExpiration = () => {
      const remaining = getRemainingSeconds(
        session.expires_at
      );

      if (remaining <= 0) {
        setDocumentData(null);
        setDocumentLocked(true);
        setDocumentError(
          'Emergency document access has expired.'
        );
      }
    };

    const interval = setInterval(
      checkDocumentExpiration,
      1000
    );

    return () => {
      clearInterval(interval);
    };
  }, [documentData, session.expires_at]);


  // -------------------------------------------------------
  // Time formatting
  // -------------------------------------------------------

  const formatRemainingTime = (seconds) => {
    if (seconds <= 0) {
      return '00:00';
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(
      remainingSeconds
    ).padStart(2, '0')}`;
  };


  const isExpired = secondsLeft <= 0;

  const sensitivity =
    session.sensitivity_level ||
    session.resource_sensitivity ||
    'Protected';

  const isCritical =
    sensitivity.toLowerCase() === 'critical';

  const isExpiringSoon =
    secondsLeft > 0 && secondsLeft <= 60;


  // -------------------------------------------------------
  // Open protected document
  // -------------------------------------------------------

  const handleOpenDocument = async () => {

    // Frontend expiration check
    if (isExpired || documentLocked) {
      setDocumentError(
        'Emergency document access has expired.'
      );

      setDocumentLocked(true);
      setDocumentData(null);

      return;
    }

    setOpeningDocument(true);
    setDocumentError('');

    try {

      /*
       * IMPORTANT:
       *
       * The service performs the actual authorization
       * check using the request ID and expires_at.
       *
       * The frontend countdown is NOT trusted as the
       * security mechanism.
       */
      const result =
        await emergencyAccessService.getAuthorizedDocument(
          session.id
        );


      // Make sure the service returned a valid request
      if (!result?.request) {
        throw new Error(
          'Unable to verify emergency access.'
        );
      }


      // Check expiration again after authorization
      if (
        !result.request.expires_at ||
        new Date(result.request.expires_at) <= new Date()
      ) {
        setDocumentData(null);
        setDocumentLocked(true);

        setDocumentError(
          'Emergency document access has expired.'
        );

        return;
      }


      // Document is authorized
      setDocumentData(result);
      setDocumentLocked(false);
      setDocumentError('');

    } catch (error) {

      console.error(
        'Unable to open protected document:',
        error
      );

      setDocumentData(null);

      const message =
        error?.message ||
        'Unable to open the protected document.';

      setDocumentError(message);

      /*
       * If the service says the access has expired,
       * permanently lock the document for this session.
       */
      if (
        message.toLowerCase().includes('expired') ||
        message.toLowerCase().includes('not available')
      ) {
        setDocumentLocked(true);
      }

    } finally {
      setOpeningDocument(false);
    }
  };


  // -------------------------------------------------------
  // Close document
  // -------------------------------------------------------

  const handleCloseDocument = () => {
    setDocumentData(null);
    setDocumentError('');
  };


  // -------------------------------------------------------
  // Close expired lock screen
  // -------------------------------------------------------

  const handleCloseExpiredLock = () => {
    setDocumentLocked(false);
    setDocumentError('');
  };


  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------

  return (
    <>
      {/* ===================================================
          SESSION CARD
          =================================================== */}

      <div
        className={`rounded-xl border p-5 transition-all ${isExpired
          ? 'border-slate-300 bg-slate-100'
          : isCritical
            ? 'border-red-300 bg-red-50'
            : 'border-slate-200 bg-white'
          }`}
      >

        {/* -------------------------------------------------
            Header
            ------------------------------------------------- */}

        <div className="flex items-start justify-between gap-4">

          <div className="flex items-start gap-3">

            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isExpired
                ? 'bg-slate-200'
                : isCritical
                  ? 'bg-red-100'
                  : 'bg-slate-100'
                }`}
            >

              {isExpired ? (
                <Lock
                  size={20}
                  className="text-slate-500"
                />
              ) : (
                <Shield
                  size={20}
                  className={
                    isCritical
                      ? 'text-red-600'
                      : 'text-slate-600'
                  }
                />
              )}

            </div>


            <div>

              <div className="flex flex-wrap items-center gap-2">

                <h3 className="font-semibold text-slate-900">
                  {isExpired
                    ? 'EXPIRED BREAK-GLASS SESSION'
                    : 'ACTIVE BREAK-GLASS SESSION'}
                </h3>


                {!isExpired && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${isCritical
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                      }`}
                  >
                    {sensitivity}
                  </span>
                )}

              </div>


              <p className="mt-1 text-sm text-slate-600">
                {session.resource_name ||
                  'Protected Document'}
              </p>

            </div>

          </div>


          {/* -------------------------------------------------
              Countdown
              ------------------------------------------------- */}

          <div
            className={`shrink-0 rounded-lg px-4 py-2 text-center ${isExpired
              ? 'bg-slate-200'
              : isExpiringSoon
                ? 'bg-red-100'
                : 'bg-slate-100'
              }`}
          >

            <div className="flex items-center justify-center gap-1">

              <Clock size={14} />

              <span
                className={`font-mono text-lg font-bold ${isExpired
                  ? 'text-slate-500'
                  : isExpiringSoon
                    ? 'text-red-700'
                    : 'text-slate-800'
                  }`}
              >
                {formatRemainingTime(secondsLeft)}
              </span>

            </div>


            <span className="text-xs text-slate-500">
              {isExpired
                ? 'Expired'
                : 'Time remaining'}
            </span>

          </div>

        </div>


        {/* -------------------------------------------------
            Session metadata
            ------------------------------------------------- */}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">

          <div className="flex items-center gap-2 text-sm text-slate-600">

            <User size={15} />

            <span>
              <strong>User:</strong>{' '}
              {session.user_email ||
                session.user_name ||
                'Unknown'}
            </span>

          </div>


          <div className="flex items-center gap-2 text-sm text-slate-600">

            <Clock size={15} />

            <span>
              <strong>Requested:</strong>{' '}
              {session.created_at
                ? formatDateTime(session.created_at)
                : '—'}
            </span>

          </div>


          <div className="flex items-center gap-2 text-sm text-slate-600">

            <Shield size={15} />

            <span>
              <strong>Approved:</strong>{' '}
              {session.approved_at
                ? formatDateTime(session.approved_at)
                : '—'}
            </span>

          </div>


          <div className="flex items-center gap-2 text-sm text-slate-600">

            <Clock size={15} />

            <span>
              <strong>Expires:</strong>{' '}
              {session.expires_at
                ? formatDateTime(session.expires_at)
                : '—'}
            </span>

          </div>

        </div>


        {/* -------------------------------------------------
            Justification
            ------------------------------------------------- */}

        {session.justification && (
          <div className="mt-4 rounded-lg bg-slate-50 p-3">

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Justification
            </p>

            <p className="mt-1 text-sm text-slate-700">
              {session.justification}
            </p>

          </div>
        )}


        {/* -------------------------------------------------
            Expiring warning
            ------------------------------------------------- */}

        {isExpiringSoon && !isExpired && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">

            <AlertTriangle size={17} />

            <span>
              This emergency access session is about
              to expire.
            </span>

          </div>
        )}


        {/* -------------------------------------------------
            Expired message
            ------------------------------------------------- */}

        {isExpired && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">

            <Lock size={17} />

            <span>
              This emergency access session has expired.
              The protected document is no longer
              accessible.
            </span>

          </div>
        )}


        {/* -------------------------------------------------
            Document error
            ------------------------------------------------- */}

        {documentError && !documentLocked && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">

            <AlertTriangle
              size={17}
              className="mt-0.5 shrink-0"
            />

            <span>{documentError}</span>

          </div>
        )}


        {/* -------------------------------------------------
            Action buttons
            ------------------------------------------------- */}

        <div className="mt-5 flex flex-wrap gap-3">

          {/* Open Document */}

          <button
            type="button"
            onClick={handleOpenDocument}
            disabled={
              openingDocument ||
              isExpired ||
              documentLocked
            }
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${openingDocument ||
              isExpired ||
              documentLocked
              ? 'cursor-not-allowed bg-slate-200 text-slate-500'
              : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
          >

            {documentLocked || isExpired ? (
              <>
                <Lock size={16} />

                DOCUMENT LOCKED
              </>
            ) : (
              <>
                <FileText size={16} />

                {openingDocument
                  ? 'OPENING...'
                  : 'OPEN DOCUMENT'}
              </>
            )}

          </button>


          {/* Revoke */}

          {canRevoke && !isExpired && (
            <button
              type="button"
              onClick={onRevoke}
              className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50"
            >

              <X size={16} />

              Revoke Access

            </button>
          )}

        </div>

      </div>


      {/* ===================================================
          PROTECTED DOCUMENT MODAL
          =================================================== */}

      {documentData &&
        !documentLocked &&
        !isExpired && (

          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">

            <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">

              {/* ------------------------------------------------
                Modal Header
                ------------------------------------------------ */}

              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-100">

                    <Shield
                      size={19}
                      className="text-red-600"
                    />

                  </div>


                  <div>

                    <h2 className="font-semibold text-slate-900">
                      {documentData.resource?.name ||
                        session.resource_name ||
                        'Protected Document'}
                    </h2>

                    <p className="text-xs text-red-600">
                      CONFIDENTIAL • TEMPORARY EMERGENCY
                      ACCESS
                    </p>

                  </div>

                </div>


                <button
                  type="button"
                  onClick={handleCloseDocument}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  aria-label="Close document"
                >
                  <X size={20} />
                </button>

              </div>


              {/* ------------------------------------------------
                Modal Content
                ------------------------------------------------ */}

              <div className="flex-1 overflow-y-auto p-6">

                {/* Security information */}

                <div className="mb-5 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 sm:grid-cols-3">

                  <div>

                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Incident
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {documentData.request?.incident_name ||
                        session.incident_name ||
                        '—'}
                    </p>

                  </div>


                  <div>

                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Approved
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {documentData.request?.approved_at
                        ? formatDateTime(
                          documentData.request.approved_at
                        )
                        : '—'}
                    </p>

                  </div>


                  <div>

                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Expires
                    </p>

                    <p className="mt-1 text-sm font-medium text-red-700">
                      {documentData.request?.expires_at
                        ? formatDateTime(
                          documentData.request.expires_at
                        )
                        : '—'}
                    </p>

                  </div>

                </div>


                {/* Document content */}

                <div className="rounded-lg border border-slate-200 bg-white">

                  <div className="border-b border-slate-200 px-5 py-3">

                    <div className="flex items-center gap-2">

                      <FileText size={17} />

                      <span className="text-sm font-semibold text-slate-800">
                        Protected Document Content
                      </span>

                    </div>

                  </div>


                  <div className="whitespace-pre-wrap p-6 font-mono text-sm leading-7 text-slate-800">

                    {documentData.resource?.document_content ||
                      'No document content available.'}

                  </div>

                </div>

              </div>


              {/* ------------------------------------------------
                Modal Footer
                ------------------------------------------------ */}

              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">

                <div className="flex items-center gap-2 text-xs text-slate-500">

                  <Lock size={14} />

                  <span>
                    Access is temporary and automatically
                    expires.
                  </span>

                </div>


                <button
                  type="button"
                  onClick={handleCloseDocument}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Close Document
                </button>

              </div>

            </div>

          </div>
        )}


      {/* ===================================================
          EXPIRED DOCUMENT LOCK
          =================================================== */}

      {documentLocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">

          <div className="w-full max-w-md rounded-xl bg-white p-6 text-center shadow-2xl">

            {/* Lock icon */}

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100">

              <Lock
                size={26}
                className="text-red-600"
              />

            </div>


            <h2 className="mt-4 text-xl font-bold text-slate-900">
              Document Access Expired
            </h2>


            <p className="mt-2 text-sm leading-6 text-slate-600">
              The emergency access session has expired.
              This protected document is no longer
              available through this session.
            </p>


            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">

              Access authorization is no longer valid.

            </div>


            <button
              type="button"
              onClick={handleCloseExpiredLock}
              className="mt-5 rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Close
            </button>

          </div>

        </div>
      )}

    </>
  );
}
export { SessionCard };