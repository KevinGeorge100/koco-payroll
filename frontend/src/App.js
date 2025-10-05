import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { RoleProvider } from './context/RoleContext';
import Layout from './components/Layout';
import LoadingSpinner from './components/LoadingSpinner';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

// Main pages
import DashboardPage from './pages/DashboardPage';
import EmployeesPage from './pages/EmployeesPage';
import AttendancePage from './pages/AttendancePage';
import LeavePage from './pages/LeavePage';
import PayrollPage from './pages/PayrollPage';
import Payslips from './pages/Payslips';
import ProfilePage from './pages/ProfilePage';
import UserManagement from './pages/admin/UserManagement';

// Authentication wrapper component
const AuthProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Public Route component (redirects to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function App() {
  return (
    <div className="App">
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignupPage />
            </PublicRoute>
          }
        />

        {/* Protected routes with role-based access */}
        <Route
          path="/*"
          element={
            <AuthProtectedRoute>
              <RoleProvider>
                <Layout>
                  <Routes>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route 
                      path="/employees/*" 
                      element={<EmployeesPage />} 
                    />
                    <Route path="/attendance/*" element={<AttendancePage />} />
                    <Route path="/leaves/*" element={<LeavePage />} />
                    <Route 
                      path="/payroll/*" 
                      element={<PayrollPage />} 
                    />
                    <Route path="/payslips" element={<Payslips />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route 
                      path="/admin/users" 
                      element={<UserManagement />} 
                    />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </Layout>
              </RoleProvider>
            </AuthProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;