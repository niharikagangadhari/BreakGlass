import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { getRoleBadgeColor, getRoleDisplayName, isOperatorOrAdmin } from '../utils/permissions';
import { formatAuditDate } from '../utils/formatDate';
import { User, Shield, Key, Lock, AlertCircle, LogOut } from 'lucide-react';

export function Profile() {
  const { user, profile, role, logout } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="border-b border-slate-800/80 pb-6">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-slate-400" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
            Identity & Authorization
          </span>
        </div>
        <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
          Security Profile & Credentials
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">
          User account identity metadata, RBAC assignment, and session security level.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 shadow-sm space-y-6">
        {/* Profile Card Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-700 text-white font-mono font-bold text-xl">
              {(profile?.full_name || user?.email || 'U')[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {profile?.full_name || 'Authorized User'}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`inline-block rounded px-3 py-1 text-xs font-mono font-bold uppercase tracking-wider border ${getRoleBadgeColor(
                role
              )}`}
            >
              {role}
            </span>
            <p className="mt-1 text-[11px] text-slate-400">
              {getRoleDisplayName(role)}
            </p>
          </div>
        </div>

        {/* Security Clearance Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <span className="text-slate-500 block mb-1">Subject Identifier (UUID)</span>
            <span className="font-mono text-slate-200 break-all">{user?.id || '—'}</span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <span className="text-slate-500 block mb-1">Account Enrolled</span>
            <span className="font-mono text-slate-200">
              {formatAuditDate(profile?.created_at || user?.created_at)}
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <span className="text-slate-500 block mb-1">Break-Glass Elevation Authority</span>
            <span className="font-semibold text-emerald-400">
              {isOperatorOrAdmin(role) ? 'Direct Approver / Adjudicator' : 'Elevation Requester'}
            </span>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <span className="text-slate-500 block mb-1">Database RLS Boundary</span>
            <span className="font-mono text-slate-200">
              {isOperatorOrAdmin(role) ? 'All Tenants / Full Audit' : 'Self-Confined Rows'}
            </span>
          </div>
        </div>

        {/* RBAC Immutability Notice */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 flex items-start gap-3 text-xs text-slate-400">
          <Lock className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-300">Role Immutability Enforcement:</span>
            <p className="mt-0.5 text-slate-400 leading-relaxed">
              In accordance with Zero-Trust principles, normal users cannot modify their own assigned role. Only authorized PostgreSQL Database Administrators can alter profile permissions via secure database migration.
            </p>
          </div>
        </div>

        {/* Logout Action */}
        <div className="pt-4 border-t border-slate-800/80 flex justify-end">
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-lg border border-red-900/40 bg-red-950/20 px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-900/40 hover:text-white transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>TERMINATE ACTIVE SESSION</span>
          </button>
        </div>
      </div>
    </div>
  );
}
