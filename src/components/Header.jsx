import React, { useState, useEffect } from 'react';
import { Menu, Bell, Shield, Clock, AlertTriangle, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getRoleBadgeColor, getRoleDisplayName } from '../utils/permissions';
import { useEmergencyRequests } from '../hooks/useEmergencyRequests';
import { useNavigate } from 'react-router-dom';

export function Header({ onToggleSidebar }) {
  const { user, profile, role, logout } = useAuth();
  const { activeSessions } = useEmergencyRequests();
  const navigate = useNavigate();
  const [utcTime, setUtcTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().substring(11, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-4 sm:px-6 backdrop-blur-md">
      {/* Left section: Hamburger & Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden border border-slate-800"
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <Shield className="h-4 w-4 text-slate-500" />
          <span className="font-semibold text-slate-300">SECURITY AUDIT DOMAIN</span>
          <span className="text-slate-600">/</span>
          <span className="font-mono text-slate-400">{utcTime}</span>
        </div>
      </div>

      {/* Center banner if user has an active emergency session */}
      {activeSessions.length > 0 && (
        <div
          onClick={() => navigate('/active-sessions')}
          className="cursor-pointer hidden md:flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors animate-pulse"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          <span>{activeSessions.length} ACTIVE EMERGENCY ACCESS SESSION</span>
        </div>
      )}

      {/* Right section: Identity & Actions */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-right">
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-white">
              {profile?.full_name || user?.email?.split('@')[0]}
            </p>
            <p className="text-[10px] text-slate-400">
              {getRoleDisplayName(role)}
            </p>
          </div>
          <span
            className={`rounded px-2 py-0.5 text-[10px] font-mono font-bold uppercase border ${getRoleBadgeColor(
              role
            )}`}
          >
            {role}
          </span>
        </div>

        <button
          onClick={handleLogout}
          title="Sign out of system"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition-colors border border-slate-800"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
