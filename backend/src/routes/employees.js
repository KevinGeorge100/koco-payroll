import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
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

// Get all employees
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('search').optional().trim(),
  query('department').optional().trim(),
  query('status').optional().isIn(['active', 'inactive', 'terminated'])
], validateRequest, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { search, department, status } = req.query;

    let query = supabase
      .from('employees')
      .select(`
        *,
        departments(name),
        positions(title)
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    
    if (department) {
      query = query.eq('department_id', department);
    }
    
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: employees, error, count } = await query;

    if (error) throw error;

    res.json({
      employees,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
});

// Get employee by ID
router.get('/:id', [
  param('id').isUUID()
], validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: employee, error } = await supabase
      .from('employees')
      .select(`
        *,
        departments(name),
        positions(title)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Employee not found'
        });
      }
      throw error;
    }

    res.json({ employee });
  } catch (error) {
    next(error);
  }
});

// Create new employee
router.post('/', [
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('dateOfBirth').optional().isISO8601(),
  body('hireDate').optional().isISO8601(),
  body('departmentId').optional().isUUID(),
  body('position').optional().trim(),
  body('positionId').optional().trim(), // Support both position and positionId
  body('salary').optional().isFloat({ min: 0 }),
  body('employeeNumber').optional().trim(),
  body('address').optional().trim(),
  body('emergencyContact').optional().isObject()
], validateRequest, async (req, res, next) => {
  try {
    // Generate employee number if not provided
    const employeeNumber = req.body.employeeNumber || `EMP${Date.now()}`;
    
    const employeeData = {
      employee_number: employeeNumber,
      first_name: req.body.firstName,
      last_name: req.body.lastName,
      email: req.body.email,
      phone: req.body.phone || null,
      date_of_birth: req.body.dateOfBirth || null,
      hire_date: req.body.hireDate || new Date().toISOString().split('T')[0],
      department_id: req.body.departmentId || null,
      position: req.body.position || req.body.positionId || null, // Handle both position and positionId
      salary: req.body.salary || null,
      address: req.body.address || null,
      emergency_contact: req.body.emergencyContact || null,
      status: 'active'
    };

    console.log('Creating employee with data:', employeeData);

    const { data: employee, error } = await supabase
      .from('employees')
      .insert(employeeData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating employee:', error);
      console.error('Employee data being inserted:', employeeData);
      throw error;
    }

    res.status(201).json({
      message: 'Employee created successfully',
      employee
    });
  } catch (error) {
    console.error('Employee creation error:', error);
    next(error);
  }
});

// Update employee
router.put('/:id', [
  param('id').isUUID(),
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().trim(),
  body('dateOfBirth').optional().isISO8601(),
  body('departmentId').optional().isUUID(),
  body('positionId').optional().isUUID(),
  body('salary').optional().isFloat({ min: 0 }),
  body('address').optional().trim(),
  body('emergencyContact').optional().isObject(),
  body('status').optional().isIn(['active', 'inactive', 'terminated'])
], validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const updateData = {};
    if (req.body.firstName) updateData.first_name = req.body.firstName;
    if (req.body.lastName) updateData.last_name = req.body.lastName;
    if (req.body.email) updateData.email = req.body.email;
    if (req.body.phone) updateData.phone = req.body.phone;
    if (req.body.dateOfBirth) updateData.date_of_birth = req.body.dateOfBirth;
    if (req.body.departmentId) updateData.department_id = req.body.departmentId;
    if (req.body.positionId) updateData.position_id = req.body.positionId;
    if (req.body.salary) updateData.salary = req.body.salary;
    if (req.body.address) updateData.address = req.body.address;
    if (req.body.emergencyContact) updateData.emergency_contact = req.body.emergencyContact;
    if (req.body.status) updateData.status = req.body.status;
    
    updateData.updated_at = new Date().toISOString();
    updateData.updated_by = req.user.id;

    const { data: employee, error } = await supabase
      .from('employees')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Employee not found'
        });
      }
      throw error;
    }

    res.json({
      message: 'Employee updated successfully',
      employee
    });
  } catch (error) {
    next(error);
  }
});

// Delete employee
router.delete('/:id', [
  param('id').isUUID()
], validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      message: 'Employee deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;