import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import RoomsPage from './pages/RoomsPage';
import GuestsPage from './pages/GuestsPage';
import ReservationsPage from './pages/ReservationsPage';
import CheckInOutPage from './pages/CheckInOutPage';
import BillingPage from './pages/BillingPage';
import HousekeepingPage from './pages/HousekeepingPage';
import StaffPage from './pages/StaffPage';
import ReportsPage from './pages/ReportsPage';

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
      <Route index element={<Dashboard />} />
      <Route path="rooms" element={<RoomsPage />} />
      <Route path="guests" element={<ProtectedRoute roles={['admin', 'manager', 'receptionist']}><GuestsPage /></ProtectedRoute>} />
      <Route path="reservations" element={<ProtectedRoute roles={['admin', 'manager', 'receptionist']}><ReservationsPage /></ProtectedRoute>} />
      <Route path="checkinout" element={<ProtectedRoute roles={['admin', 'manager', 'receptionist']}><CheckInOutPage /></ProtectedRoute>} />
      <Route path="billing" element={<ProtectedRoute roles={['admin', 'manager', 'receptionist']}><BillingPage /></ProtectedRoute>} />
      <Route path="housekeeping" element={<HousekeepingPage />} />
      <Route path="staff" element={<ProtectedRoute roles={['admin','manager']}><StaffPage /></ProtectedRoute>} />
      <Route path="reports" element={<ProtectedRoute roles={['admin','manager']}><ReportsPage /></ProtectedRoute>} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
