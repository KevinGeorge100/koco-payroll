import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const RoleContext = createContext();

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

export const RoleProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!isAuthenticated || !user) {
        setUserRole(null);
        setPermissions([]);
        setLoading(false);
        return;
      }

      try {
        // Get token from Supabase session instead of localStorage
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        if (!token) {
          setUserRole('employee');
          setPermissions(getRolePermissions('employee'));
          setLoading(false);
          return;
        }
        
        const response = await fetch('http://localhost:5000/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUserRole(data.profile?.role || 'employee');
          
          // Set permissions based on role
          const rolePermissions = getRolePermissions(data.profile?.role || 'employee');
          setPermissions(rolePermissions);
        } else {
          // Default to employee role if profile fetch fails
          setUserRole('employee');
          setPermissions(getRolePermissions('employee'));
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole('employee');
        setPermissions(getRolePermissions('employee'));
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user, isAuthenticated]);

  const value = {
    userRole,
    permissions,
    loading,
    isAdmin: userRole === 'admin',
    isHR: userRole === 'hr',
    isEmployee: userRole === 'employee',
    isHROrAdmin: ['hr', 'admin'].includes(userRole),
    hasRole: (roles) => {
      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      return allowedRoles.includes(userRole);
    },
    hasPermission: (resource, action) => {
      return permissions.some(p => p.resource === resource && p.action === action);
    },
    canAccess: (resource, action) => {
      // Admin has access to everything
      if (userRole === 'admin') return true;
      
      // Check specific permissions
      return permissions.some(p => p.resource === resource && p.action === action);
    }
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};

// Helper function to get permissions based on role
const getRolePermissions = (role) => {
  const permissionSets = {
    admin: [
      // Full access to all resources
      { resource: 'employees', action: 'create' },
      { resource: 'employees', action: 'read' },
      { resource: 'employees', action: 'update' },
      { resource: 'employees', action: 'delete' },
      { resource: 'payroll', action: 'create' },
      { resource: 'payroll', action: 'read' },
      { resource: 'payroll', action: 'update' },
      { resource: 'payroll', action: 'delete' },
      { resource: 'payslips', action: 'read' },
      { resource: 'payslips', action: 'create' },
      { resource: 'attendance', action: 'create' },
      { resource: 'attendance', action: 'read' },
      { resource: 'attendance', action: 'update' },
      { resource: 'attendance', action: 'delete' },
      { resource: 'leaves', action: 'create' },
      { resource: 'leaves', action: 'read' },
      { resource: 'leaves', action: 'update' },
      { resource: 'leaves', action: 'delete' },
      { resource: 'users', action: 'create' },
      { resource: 'users', action: 'read' },
      { resource: 'users', action: 'update' },
      { resource: 'users', action: 'delete' },
    ],
    hr: [
      // HR permissions
      { resource: 'employees', action: 'create' },
      { resource: 'employees', action: 'read' },
      { resource: 'employees', action: 'update' },
      { resource: 'payroll', action: 'create' },
      { resource: 'payroll', action: 'read' },
      { resource: 'payroll', action: 'update' },
      { resource: 'payslips', action: 'read' },
      { resource: 'payslips', action: 'create' },
      { resource: 'attendance', action: 'read' },
      { resource: 'attendance', action: 'update' },
      { resource: 'leaves', action: 'read' },
      { resource: 'leaves', action: 'update' },
      { resource: 'users', action: 'read' },
    ],
    employee: [
      // Employee permissions (limited to own data)
      { resource: 'employees', action: 'read' }, // own profile only
      { resource: 'payslips', action: 'read' },  // own payslips only
      { resource: 'attendance', action: 'read' }, // own attendance only
      { resource: 'attendance', action: 'create' }, // mark own attendance
      { resource: 'leaves', action: 'create' },   // request leave
      { resource: 'leaves', action: 'read' }      // view own leaves
    ]
  };

  return permissionSets[role] || permissionSets.employee;
};