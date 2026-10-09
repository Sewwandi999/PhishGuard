import React, { useState } from 'react'; 
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import Navigation from './components/Navigation.jsx';
import MessageScanner from './components/MessageScanner.jsx';
import ScanHistory from './components/ScanHistory.jsx';
import DatasetManager from './components/DatasetManager.jsx';
import DataQuality from './components/DataQuality.jsx';
import LogsViewer from './components/LogsViewer.jsx';
import ReportGenerator from './components/ReportGenerator.jsx';
import UserManagement from './components/UserManagement.jsx';
import Chatbot from './components/Chatbot.jsx';
import LearningCenter from './components/LearningCenter.jsx';
import MobileGoogleHandoff from './components/MobileGoogleHandoff.jsx';
import PhishingAlertBanner from './components/PhishingAlertBanner.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';

function AccessDenied() {
  return (
    <div className="max-w-xl bg-white border border-red-100 rounded-xl p-8 shadow-sm">
      <h1 className="text-2xl text-slate-900">Access denied</h1>
      <p className="text-slate-600 mt-2">You are not authorized to view this page for your current role.</p>
    </div>
  );
}

function RoleRoute({ role, allow, children }) {
  if (!allow.includes(role)) {
    return <AccessDenied />;
  }
  return children;
}

function readStoredSession() {
  try {
    const token = sessionStorage.getItem("authToken");
    const email = sessionStorage.getItem("sessionEmail");
    const role = sessionStorage.getItem("sessionRole");
    if (token && email) {
      return { email, role: String(role || "user").toLowerCase() };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function stripGoogleIdentityOverlays() {
  try {
    window.google?.accounts?.id?.cancel?.();
  } catch {
    /* ignore */
  }
  document
    .querySelectorAll(
      'iframe[src*="accounts.google.com"], iframe[src*="google.com/gsi"], #credential_picker_container, [id^="gsi_"]',
    )
    .forEach((el) => el.remove());
}

export default function App() {
  const navigate = useNavigate();
  const [stored] = useState(() => readStoredSession());
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(stored));
  const [userRole, setUserRole] = useState(stored?.role ?? null);
  const [userEmail, setUserEmail] = useState(stored?.email ?? null);

  const handleLogin = (session) => {
    stripGoogleIdentityOverlays();
    const normalizedRole = typeof session.role === "string" ? session.role.toLowerCase() : "user";
    setIsAuthenticated(true);
    setUserRole(normalizedRole);
    setUserEmail(session.email ?? null);
    if (session.token) {
      sessionStorage.setItem("authToken", session.token);
    } else {
      sessionStorage.removeItem("authToken");
    }
    if (session.email) {
      sessionStorage.setItem("sessionEmail", session.email);
    } else {
      sessionStorage.removeItem("sessionEmail");
    }
    sessionStorage.setItem("sessionRole", normalizedRole);
    navigate("/dashboard", { replace: true });
  };

  const handleLogout = () => {
    stripGoogleIdentityOverlays();
    setIsAuthenticated(false);
    setUserRole(null);
    setUserEmail(null);
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("sessionEmail");
    sessionStorage.removeItem("sessionRole");
  };

  if (window.location.pathname === "/mobile-google") {
    return <MobileGoogleHandoff />;
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ErrorBoundary>
        <Navigation userRole={userRole} userEmail={userEmail} onLogout={handleLogout} />
      </ErrorBoundary>

      <main className="flex-1 ml-64 p-8">
        <ErrorBoundary>
          <PhishingAlertBanner />
        </ErrorBoundary>
        <ErrorBoundary>
          <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard userRole={userRole} />} />
          <Route path="/scanner" element={<MessageScanner />} />
          <Route path="/history" element={<ScanHistory />} />
          <Route
            path="/dataset"
            element={
              <RoleRoute role={userRole} allow={["admin", "analyst"]}>
                <DatasetManager />
              </RoleRoute>
            }
          />
          <Route
            path="/data-quality"
            element={
              <RoleRoute role={userRole} allow={["admin", "analyst"]}>
                <DataQuality />
              </RoleRoute>
            }
          />
          <Route
            path="/logs"
            element={
              <RoleRoute role={userRole} allow={["admin", "analyst"]}>
                <LogsViewer />
              </RoleRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <RoleRoute role={userRole} allow={["admin", "analyst"]}>
                <ReportGenerator />
              </RoleRoute>
            }
          />
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/learn" element={<LearningCenter />} />
          <Route
            path="/users"
            element={
              <RoleRoute role={userRole} allow={["admin"]}>
                <UserManagement />
              </RoleRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
}
