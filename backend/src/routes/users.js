import express from 'express';
import { body, validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid input data',
      details: errors.array()
    });
  }
  next();
};

// Get current user profile
router.get('/profile', async (req, res, next) => {
  try {
    // For rollback - return default admin profile
    res.status(200).json({
      message: 'Profile retrieved successfully',
      user: { id: 'test-user', email: 'admin@test.com' },
      profile: { role: 'admin', first_name: 'Admin', last_name: 'User' },
      role: 'admin'
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    next(error);
  }
});

// Update current user profile (limited fields)
router.put('/profile', [
  body('first_name').optional().trim().isLength({ min: 1, max: 50 }),
  body('last_name').optional().trim().isLength({ min: 1, max: 50 }),
], validateRequest, async (req, res, next) => {
  try {
    const { first_name, last_name } = req.body;
    
    const updateData = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    updateData.updated_at = new Date().toISOString();

    const { data: updatedProfile, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return res.status(400).json({
        error: 'Update Failed',
        message: error.message
      });
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Profile update error:', error);
    next(error);
  }
});

// Get all user profiles
router.get('/users', async (req, res, next) => {
  try {
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        employees(first_name, last_name, employee_number)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Users fetch error:', error);
      return res.status(400).json({
        error: 'Fetch Failed',
        message: error.message
      });
    }

    res.status(200).json({
      message: 'Users retrieved successfully',
      users: profiles
    });
  } catch (error) {
    console.error('Users fetch error:', error);
    next(error);
  }
});

// Create user profile
router.post('/users', [
  body('email').isEmail().normalizeEmail(),
  body('first_name').trim().isLength({ min: 1, max: 50 }),
  body('last_name').trim().isLength({ min: 1, max: 50 }),
  body('role').isIn(['admin', 'hr', 'employee']),
  body('employee_id').optional().isUUID(),
  body('department_id').optional().isUUID(),
], validateRequest, async (req, res, next) => {
  try {
    const { email, first_name, last_name, role, employee_id, department_id } = req.body;

    // First create the auth user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: 'TempPassword123!', // User will need to reset
      email_confirm: true,
      user_metadata: {
        first_name,
        last_name,
        role
      }
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      return res.status(400).json({
        error: 'User Creation Failed',
        message: authError.message
      });
    }

    // Create user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert([{
        id: authUser.user.id,
        email,
        first_name,
        last_name,
        role,
        employee_id,
        department_id,
        is_active: true
      }])
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Cleanup: delete the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id);
      
      return res.status(400).json({
        error: 'Profile Creation Failed',
        message: profileError.message
      });
    }

    res.status(201).json({
      message: 'User created successfully',
      user: authUser.user,
      profile
    });
  } catch (error) {
    console.error('User creation error:', error);
    next(error);
  }
});

// Update user role (Admin only)
router.put('/users/:userId/role', [
  body('role').isIn(['admin', 'hr', 'employee']),
], validateRequest, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    const { data: updatedProfile, error } = await supabase
      .from('user_profiles')
      .update({ 
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Role update error:', error);
      return res.status(400).json({
        error: 'Role Update Failed',
        message: error.message
      });
    }

    res.status(200).json({
      message: 'User role updated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Role update error:', error);
    next(error);
  }
});

// Deactivate user
router.put('/users/:userId/deactivate', async (req, res, next) => {
  try {
    const { userId } = req.params;

    const { data: updatedProfile, error } = await supabase
      .from('user_profiles')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('User deactivation error:', error);
      return res.status(400).json({
        error: 'Deactivation Failed',
        message: error.message
      });
    }

    res.status(200).json({
      message: 'User deactivated successfully',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('User deactivation error:', error);
    next(error);
  }
});

export default router;