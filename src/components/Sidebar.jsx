import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  Flame,
  Clock,
  ScrollText,
  ShieldCheck,
  User,
  LogOut,
  AlertOctagon,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import {
  isOperatorOrAdmin,
  getRoleDisplayName,
  getRoleBadgeColor,
} from '../utils/permissions';
import { useEmergencyRequests } from '../hooks/useEmergencyRequests';

export function Sidebar({ isOpen, onClose }) {
  const { user, profile, role, logout } = useAuth();
  const { activeSessions, pendingRequests } = useEmergencyRequests();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard
    },

    // Regular users can request emergency access.
    // Admins/operators manage requests instead.
    ...(!isOperatorOrAdmin(role)
      ? [
        {
          label: 'Request Access',
          path: '/emergency-access',
          icon: Flame,
          highlight: true
        }
      ]
      : []),

    {
      label: 'Active Sessions',
      path: '/active-sessions',
      icon: Clock,
      badge:
        activeSessions.length > 0
          ? activeSessions.length
          : null,
      badgeVariant: 'active'
    },

    {
      label: 'Audit Trail',
      path: '/audit-logs',
      icon: ScrollText
    },

    ...(isOperatorOrAdmin(role)
      ? [
        {
          label: 'Admin Console',
          path: '/admin',
          icon: ShieldCheck,
          badge:
            pendingRequests.length > 0
              ? `${pendingRequests.length} PENDING`
              : null,
          badgeVariant: 'pending'
        },

        {
          label: 'Protected Documents',
          path: '/protected-documents',
          icon: ShieldAlert
        }
      ]
      : []),

    {
      label: 'Security Profile',
      path: '/profile',
      icon: User
    }
  ];
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-800/80 bg-[#0B132B] transition-transform duration-300 lg:static lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Header Branding */}
        <div className="flex h-20 items-center gap-3 border-b border-slate-800/80 px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/20 border border-red-500/40 text-red-500 shadow-inner">
            <ShieldAlert className="h-6 w-6" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-wider text-white">
                BREAK GLASS
              </span>

              <span className="rounded bg-red-500/20 px-1.5 py-0.2 text-[10px] font-bold text-red-400 border border-red-500/30">
                PROD
              </span>
            </div>

            <p className="text-[11px] font-medium tracking-tight text-slate-400">
              Emergency Access Management
            </p>
          </div>
        </div>

        {/* Emergency Trigger Button */}
        {role !== 'admin' && (
          <div className="p-4">
            {!isOperatorOrAdmin(role) && (
              <NavLink
                to="/emergency-access"
                onClick={onClose}
                className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-950/50 hover:from-red-500 hover:to-rose-600 border border-red-400/40 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <AlertOctagon className="h-4 w-4 animate-pulse" />
                <span>BREAK GLASS ACCESS</span>
              </NavLink>)}
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1 px-3 py-2 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Control Center
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${isActive
                    ? 'bg-slate-800/90 text-white font-semibold shadow-sm border border-slate-700/60'
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-slate-400 group-hover:text-white" />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold font-mono ${item.badgeVariant === 'active'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer Identity & Logout */}
        <div className="border-t border-slate-800/80 p-4 bg-[#070C1E]/60">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">
                {profile?.full_name || user?.email?.split('@')[0]}
              </p>

              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider border ${getRoleBadgeColor(
                    role
                  )}`}
                >
                  {role}
                </span>

                <span className="text-[10px] text-slate-500 truncate">
                  {user?.email}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="ml-2 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors border border-transparent hover:border-slate-700"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}