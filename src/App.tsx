
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import Login from '@/pages/Login';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Dispatch from '@/pages/Dispatch';
import Bookings from '@/pages/Bookings';
import Vehicles from '@/pages/Vehicles';
import Customers from '@/pages/Customers';
import Maintenance from '@/pages/Maintenance';
import Rental from '@/pages/Rental';
import Billing from '@/pages/Billing';
import Reports from '@/pages/Reports';
import Accidents from '@/pages/Accidents';
import Settings from '@/pages/Settings';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="dispatch" element={<Dispatch />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="customers" element={<Customers />} />
          <Route path="maintenance" element={<Maintenance />} />
          <Route path="rental" element={<Rental />} />
          <Route path="billing" element={<Billing />} />
          <Route path="reports" element={<Reports />} />
          <Route path="accidents" element={<Accidents />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}
