/**
 * App.jsx — Root application with AuthProvider + React Router
 *
 * Routes from frontend.md §3 with ProtectedRoute role guards.
 * Public: /login
 * All authenticated: /, /vehicles, /drivers, /fuel-expenses
 * Role-gated: /trips (fleet_manager, driver), /maintenance (fleet_manager),
 *             /reports (fleet_manager, safety_officer, financial_analyst),
 *             /settings (fleet_manager)
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Login       from './pages/Login';
import Dashboard   from './pages/Dashboard';
import Vehicles    from './pages/Vehicles';
import Drivers     from './pages/Drivers';
import Trips       from './pages/Trips';
import Maintenance from './pages/Maintenance';
import FuelExpenses from './pages/FuelExpenses';
import Reports     from './pages/Reports';
import Settings    from './pages/Settings';

const ALL_ROLES = ['fleet_manager', 'driver', 'safety_officer', 'financial_analyst'];

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* Authenticated shell */}
          <Route
            element={
              <ProtectedRoute roles={ALL_ROLES}>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />

            <Route path="vehicles" element={
              <ProtectedRoute roles={ALL_ROLES}><Vehicles /></ProtectedRoute>
            } />

            <Route path="drivers" element={
              <ProtectedRoute roles={ALL_ROLES}><Drivers /></ProtectedRoute>
            } />

            <Route path="trips" element={
              <ProtectedRoute roles={['fleet_manager', 'driver']}><Trips /></ProtectedRoute>
            } />

            <Route path="maintenance" element={
              <ProtectedRoute roles={['fleet_manager']}><Maintenance /></ProtectedRoute>
            } />

            <Route path="fuel-expenses" element={
              <ProtectedRoute roles={['fleet_manager', 'driver', 'financial_analyst']}><FuelExpenses /></ProtectedRoute>
            } />

            <Route path="reports" element={
              <ProtectedRoute roles={['fleet_manager', 'safety_officer', 'financial_analyst']}><Reports /></ProtectedRoute>
            } />

            <Route path="settings" element={
              <ProtectedRoute roles={['fleet_manager']}><Settings /></ProtectedRoute>
            } />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
