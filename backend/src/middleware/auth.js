import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Access token is required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }

    // Get user profile with role information
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      // If profile doesn't exist, create a default employee profile
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert([{
          id: user.id,
          email: user.email,
          role: 'employee',
          is_active: true
        }])
        .select()
        .single();

      if (createError) {
        console.error('Profile creation error:', createError);
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Failed to create user profile'
        });
      }

      req.user = { ...user, profile: newProfile };
      req.userRole = 'employee';
    } else {
      req.user = { ...user, profile };
      req.userRole = profile.role;
    }

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed'
    });
  }
};

export const requireRole = (roles) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.userRole) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      
      if (!allowedRoles.includes(req.userRole)) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
        });
      }

      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Authorization check failed'
      });
    }
  };
};

export const requirePermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.userRole) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      // Check if user has permission using database function
      const { data, error } = await supabase
        .rpc('has_permission', {
          user_id: req.user.id,
          resource_name: resource,
          action_name: action
        });

      if (error) {
        console.error('Permission check error:', error);
        return res.status(500).json({
          error: 'Internal Server Error',
          message: 'Permission check failed'
        });
      }

      if (!data) {
        return res.status(403).json({
          error: 'Forbidden',
          message: `Access denied. Required permission: ${action} on ${resource}`
        });
      }

      next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Permission check failed'
      });
    }
  };
};

// Admin only middleware
export const requireAdmin = requireRole(['admin']);

// HR and Admin middleware
export const requireHROrAdmin = requireRole(['hr', 'admin']);

// Check if user can access specific employee data
export const requireEmployeeAccess = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const userRole = req.userRole;
    
    // Admin and HR can access any employee
    if (['admin', 'hr'].includes(userRole)) {
      return next();
    }
    
    // Regular employees can only access their own data
    if (userRole === 'employee') {
      if (!req.user.profile.employee_id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Employee profile not linked'
        });
      }
      
      if (req.user.profile.employee_id !== employeeId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Access denied. You can only view your own data'
        });
      }
    }
    
    next();
  } catch (error) {
    console.error('Employee access middleware error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Access check failed'
    });
  }
};