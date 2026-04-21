import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import TeamDashboard from './pages/TeamDashboard';
import TeamRoster from './pages/TeamRoster';
import LogScore from './pages/LogScore';
import MemberDashboard from './pages/MemberDashboard';
import ExecutiveDashboard from './pages/ExecutiveDashboard';
import WeeklyDigest from './pages/WeeklyDigest';
import BillingSuccess from './pages/BillingSuccess';
import SetupCompany from './pages/SetupCompany';
import CreatorDashboard from './pages/CreatorDashboard';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'executive') return <Navigate to="/executive" replace />;
  if (user.role === 'creator') return <Navigate to="/creator-dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/setup-company" element={<SetupCompany />} />

          {/* Manager routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute role="manager">
                <TeamDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/roster"
            element={
              <ProtectedRoute role="manager">
                <TeamRoster />
              </ProtectedRoute>
            }
          />
          <Route
            path="/log"
            element={
              <ProtectedRoute role="manager">
                <LogScore />
              </ProtectedRoute>
            }
          />
          <Route
            path="/members/:memberId"
            element={
              <ProtectedRoute role="manager">
                <MemberDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/digest"
            element={
              <ProtectedRoute role="manager">
                <WeeklyDigest />
              </ProtectedRoute>
            }
          />

          {/* Executive */}
          <Route
            path="/executive"
            element={
              <ProtectedRoute>
                <ExecutiveDashboard />
              </ProtectedRoute>
            }
          />

          {/* Creator */}
          <Route
            path="/creator-dashboard"
            element={
              <ProtectedRoute role="creator">
                <CreatorDashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/billing/success" element={<BillingSuccess />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
