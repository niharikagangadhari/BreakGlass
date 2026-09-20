import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { EmergencyAccess } from './pages/EmergencyAccess';
import { AdminDashboard } from './pages/AdminDashboard';
import { ActiveSessions } from './pages/ActiveSessions';
import { ProtectedDocuments } from './pages/ProtectedDocuments';
import { AuditLogs } from './pages/AuditLogs';
import { Profile } from './pages/Profile';
import { NotFound } from './pages/NotFound';
import { isOperatorOrAdmin } from './utils/permissions';
import { ShieldAlert } from 'lucide-react';
import PWAUpdatePrompt from './components/PWAUpdatePrompt';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070C1E] flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="h-8 w-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono tracking-wider uppercase text-slate-500">
          Verifying Cryptographic Credentials...
        </span>
      </div>
    );
  }


  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070C1E] flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isOperatorOrAdmin(role)) {
    return (
      <div className="p-8 text-center">
        <div className="max-w-md mx-auto rounded-2xl border border-red-900/50 bg-red-950/20 p-8">
          <ShieldAlert className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-3 text-lg font-bold text-white">403 Access Denied</h2>
          <p className="mt-2 text-xs text-slate-400">
            You do not possess the required Operator or Administrator clearance to access this control plane.
          </p>
        </div>
      </div>
    );
  }

  return children;
}

function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-[#070C1E] overflow-hidden">
      {/* Dark navy enterprise sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function App() {
  const { user } = useAuth();

  return (
    <>
      <Routes>
        {/* Public Login Route */}
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <Login />}
        />

        {/* Authenticated Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Emergency Access Request Page */}
        <Route
          path="/emergency-access"
          element={
            <ProtectedRoute>
              <MainLayout>
                <EmergencyAccess />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Active Sessions Page */}
        <Route
          path="/active-sessions"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ActiveSessions />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Audit Logs Trail */}
        <Route
          path="/audit-logs"
          element={
            <ProtectedRoute>
              <MainLayout>
                <AuditLogs />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <MainLayout>
                <AdminDashboard />
              </MainLayout>
            </AdminRoute>
          }
        />

        {/* User Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Profile />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 Route */}
        <Route
          path="*"
          element={
            <MainLayout>
              <NotFound />
            </MainLayout>
          }
        />
        {/* Protected Document Management */}
        <Route
          path="/protected-documents"
          element={
            <AdminRoute>
              <MainLayout>
                <ProtectedDocuments />
              </MainLayout>
            </AdminRoute>
          }
        />
      </Routes>

      {/* Registers the service worker, shows the offline/update toasts.
          Lives outside <Routes> so it persists across every page. */}
      <PWAUpdatePrompt />
    </>
  );
}
export default App;
