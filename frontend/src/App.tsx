import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DatasetProvider } from './contexts/DatasetContext';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { ConsumptionAnalytics } from './pages/ConsumptionAnalytics';
import { Forecasting } from './pages/Forecasting';
import { AnomalyDetection } from './pages/AnomalyDetection';
import { UsagePatterns } from './pages/UsagePatterns';
import { ElectricityBill } from './pages/ElectricityBill';
import { Recommendations } from './pages/Recommendations';
import { DatasetManagement } from './pages/DatasetManagement';
import { Settings } from './pages/Settings';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB] text-slate-500 text-sm">
        Initializing PowerPulse AI...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DatasetProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Application Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="analytics" element={<ConsumptionAnalytics />} />
              <Route path="forecasting" element={<Forecasting />} />
              <Route path="anomalies" element={<AnomalyDetection />} />
              <Route path="patterns" element={<UsagePatterns />} />
              <Route path="bill" element={<ElectricityBill />} />
              <Route path="recommendations" element={<Recommendations />} />
              <Route path="datasets" element={<DatasetManagement />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </DatasetProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

