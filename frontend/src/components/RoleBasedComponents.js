import React from 'react';
import { useRole } from '../context/RoleContext';

// Higher-order component for role-based access
export const withRoleAccess = (allowedRoles) => (WrappedComponent) => {
  return function RoleProtectedComponent(props) {
    const { hasRole, loading } = useRole();
    
    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading...</span>
        </div>
      );
    }
    
    if (!hasRole(allowedRoles)) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 m-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Access Denied</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>You don't have permission to access this resource.</p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    return <WrappedComponent {...props} />;
  };
};

// Component for conditional rendering based on roles
export const RoleBasedComponent = ({ allowedRoles, fallback = null, children }) => {
  const { hasRole, loading } = useRole();
  
  if (loading) {
    return null; // or a loading spinner
  }
  
  if (!hasRole(allowedRoles)) {
    return fallback;
  }
  
  return <>{children}</>;
};

// Component for permission-based rendering
export const PermissionBasedComponent = ({ resource, action, fallback = null, children }) => {
  const { hasPermission, loading } = useRole();
  
  if (loading) {
    return null;
  }
  
  if (!hasPermission(resource, action)) {
    return fallback;
  }
  
  return <>{children}</>;
};

// Specific role components
export const AdminOnly = ({ children, fallback = null }) => (
  <RoleBasedComponent allowedRoles={['admin']} fallback={fallback}>
    {children}
  </RoleBasedComponent>
);

export const HROnly = ({ children, fallback = null }) => (
  <RoleBasedComponent allowedRoles={['hr']} fallback={fallback}>
    {children}
  </RoleBasedComponent>
);

export const HROrAdmin = ({ children, fallback = null }) => (
  <RoleBasedComponent allowedRoles={['hr', 'admin']} fallback={fallback}>
    {children}
  </RoleBasedComponent>
);

export const EmployeeOnly = ({ children, fallback = null }) => (
  <RoleBasedComponent allowedRoles={['employee']} fallback={fallback}>
    {children}
  </RoleBasedComponent>
);

// Protected route component
export const ProtectedRoute = ({ allowedRoles, children }) => {
  const { hasRole, loading } = useRole();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!hasRole(allowedRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
          <div className="text-center">
            <svg className="mx-auto h-16 w-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Access Denied</h3>
            <p className="mt-2 text-sm text-gray-500">
              You don't have permission to access this page. Please contact your administrator if you believe this is an error.
            </p>
            <div className="mt-6">
              <button
                onClick={() => window.history.back()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return children;
};

// Hook for navigation control
export const useRoleNavigation = () => {
  const { userRole, canAccess } = useRole();
  
  const getNavigationItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/dashboard', allowedRoles: ['admin', 'hr', 'employee'] }
    ];
    
    if (canAccess('employees', 'read')) {
      baseItems.push(
        { name: 'Employees', href: '/employees', allowedRoles: ['admin', 'hr'] },
        ...(canAccess('employees', 'create') ? [{ name: 'Add Employee', href: '/employees/new', allowedRoles: ['admin', 'hr'] }] : [])
      );
    }
    
    if (canAccess('attendance', 'read')) {
      baseItems.push({ name: 'Attendance', href: '/attendance', allowedRoles: ['admin', 'hr', 'employee'] });
    }
    
    if (canAccess('leaves', 'read')) {
      baseItems.push({ name: 'Leaves', href: '/leaves', allowedRoles: ['admin', 'hr', 'employee'] });
    }
    
    if (canAccess('payroll', 'read')) {
      baseItems.push({ name: 'Payroll', href: '/payroll', allowedRoles: ['admin', 'hr'] });
    }
    
    if (canAccess('payslips', 'read')) {
      baseItems.push({ name: 'Payslips', href: '/payslips', allowedRoles: ['admin', 'hr', 'employee'] });
    }
    
    return baseItems.filter(item => item.allowedRoles.includes(userRole));
  };
  
  return { getNavigationItems };
};