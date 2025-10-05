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

// Get timesheets (with role-based filtering)
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('employeeId').optional().isUUID(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601(),
  query('status').optional().isIn(['draft', 'submitted', 'approved', 'rejected'])
], validateRequest, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { employeeId, startDate, endDate, status } = req.query;

    let query = supabase
      .from('timesheets')
      .select(`
        *,
        employees(first_name, last_name, employee_number)
      `, { count: 'exact' });

    // Role-based filtering
    if (req.userRole === 'employee') {
      query = query.eq('employee_id', req.user.id);
    } else if (employeeId) {
      query = query.eq('employee_id', employeeId);
    }

    // Apply other filters
    if (startDate) {
      query = query.gte('date', startDate);
    }
    
    if (endDate) {
      query = query.lte('date', endDate);
    }
    
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)
                  .order('date', { ascending: false });

    const { data: timesheets, error, count } = await query;

    if (error) throw error;

    res.json({
      timesheets,
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

// Get timesheet by ID
router.get('/:id', [
  param('id').isUUID()
], validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: timesheet, error } = await supabase
      .from('timesheets')
      .select(`
        *,
        employees(first_name, last_name, employee_number)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Timesheet not found'
        });
      }
      throw error;
    }

    // Check permissions - employees can only view their own timesheets
    if (req.userRole === 'employee' && timesheet.employee_id !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own timesheets'
      });
    }

    res.json({ timesheet });
  } catch (error) {
    next(error);
  }
});

// Create timesheet entry
router.post('/', [
  body('employeeId').optional().isUUID(),
  body('date').isISO8601(),
  body('clockIn').isISO8601(),
  body('clockOut').optional().isISO8601(),
  body('breakDuration').optional().isFloat({ min: 0 }),
  body('description').optional().trim(),
  body('projectId').optional().isUUID()
], validateRequest, async (req, res, next) => {
  try {
    const {
      employeeId,
      date,
      clockIn,
      clockOut,
      breakDuration = 0,
      description,
      projectId
    } = req.body;

    // Determine employee ID
    let finalEmployeeId = employeeId;
    if (req.userRole === 'employee') {
      finalEmployeeId = req.user.id; // Employees can only create their own timesheets
    } else if (!employeeId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Employee ID is required'
      });
    }

    // Calculate hours worked if clock out is provided
    let hoursWorked = 0;
    if (clockOut) {
      const clockInTime = new Date(clockIn);
      const clockOutTime = new Date(clockOut);
      const totalMinutes = (clockOutTime - clockInTime) / (1000 * 60);
      hoursWorked = Math.max(0, (totalMinutes - breakDuration) / 60);
    }

    const timesheetData = {
      employee_id: finalEmployeeId,
      date,
      clock_in: clockIn,
      clock_out: clockOut,
      break_duration: breakDuration,
      hours_worked: hoursWorked,
      description,
      project_id: projectId,
      status: 'draft',
      created_by: req.user.id
    };

    const { data: timesheet, error } = await supabase
      .from('timesheets')
      .insert(timesheetData)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Timesheet entry created successfully',
      timesheet
    });
  } catch (error) {
    next(error);
  }
});

// Update timesheet entry
router.put('/:id', [
  param('id').isUUID(),
  body('date').optional().isISO8601(),
  body('clockIn').optional().isISO8601(),
  body('clockOut').optional().isISO8601(),
  body('breakDuration').optional().isFloat({ min: 0 }),
  body('description').optional().trim(),
  body('projectId').optional().isUUID()
], validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if timesheet exists and user has permission
    const { data: existingTimesheet, error: fetchError } = await supabase
      .from('timesheets')
      .select('employee_id, status')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Timesheet not found'
        });
      }
      throw fetchError;
    }

    // Check permissions
    if (req.userRole === 'employee' && existingTimesheet.employee_id !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only update your own timesheets'
      });
    }

    // Don't allow updates to approved timesheets
    if (existingTimesheet.status === 'approved') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot update approved timesheets'
      });
    }

    const updateData = {};
    if (req.body.date) updateData.date = req.body.date;
    if (req.body.clockIn) updateData.clock_in = req.body.clockIn;
    if (req.body.clockOut !== undefined) updateData.clock_out = req.body.clockOut;
    if (req.body.breakDuration !== undefined) updateData.break_duration = req.body.breakDuration;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.projectId !== undefined) updateData.project_id = req.body.projectId;

    // Recalculate hours if clock times are being updated
    if (updateData.clock_in || updateData.clock_out || updateData.break_duration !== undefined) {
      const clockIn = updateData.clock_in || existingTimesheet.clock_in;
      const clockOut = updateData.clock_out || existingTimesheet.clock_out;
      const breakDuration = updateData.break_duration !== undefined ? updateData.break_duration : existingTimesheet.break_duration;

      if (clockIn && clockOut) {
        const clockInTime = new Date(clockIn);
        const clockOutTime = new Date(clockOut);
        const totalMinutes = (clockOutTime - clockInTime) / (1000 * 60);
        updateData.hours_worked = Math.max(0, (totalMinutes - breakDuration) / 60);
      }
    }

    updateData.updated_at = new Date().toISOString();
    updateData.updated_by = req.user.id;

    const { data: timesheet, error } = await supabase
      .from('timesheets')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      message: 'Timesheet updated successfully',
      timesheet
    });
  } catch (error) {
    next(error);
  }
});

// Submit timesheet for approval
router.patch('/:id/submit', [
  param('id').isUUID()
], validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: timesheet, error } = await supabase
      .from('timesheets')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: req.user.id
      })
      .eq('id', id)
      .eq('status', 'draft')
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Timesheet not found or already submitted'
        });
      }
      throw error;
    }

    // Check permissions
    if (req.userRole === 'employee' && timesheet.employee_id !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only submit your own timesheets'
      });
    }

    res.json({
      message: 'Timesheet submitted for approval',
      timesheet
    });
  } catch (error) {
    next(error);
  }
});

// Approve/Reject timesheet
router.patch('/:id/review', [
  param('id').isUUID(),
  body('action').isIn(['approve', 'reject']),
  body('notes').optional().trim()
], validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;

    const status = action === 'approve' ? 'approved' : 'rejected';
    const updateData = {
      status,
      [`${action}d_at`]: new Date().toISOString(),
      [`${action}d_by`]: req.user.id,
      review_notes: notes,
      updated_at: new Date().toISOString(),
      updated_by: req.user.id
    };

    const { data: timesheet, error } = await supabase
      .from('timesheets')
      .update(updateData)
      .eq('id', id)
      .eq('status', 'submitted')
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Timesheet not found or not submitted for review'
        });
      }
      throw error;
    }

    res.json({
      message: `Timesheet ${action}d successfully`,
      timesheet
    });
  } catch (error) {
    next(error);
  }
});

// Delete timesheet
router.delete('/:id', [
  param('id').isUUID()
], validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if timesheet exists and user has permission
    const { data: existingTimesheet, error: fetchError } = await supabase
      .from('timesheets')
      .select('employee_id, status')
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Timesheet not found'
        });
      }
      throw fetchError;
    }

    // Check permissions
    if (req.userRole === 'employee') {
      if (existingTimesheet.employee_id !== req.user.id) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only delete your own timesheets'
        });
      }
      
      if (existingTimesheet.status !== 'draft') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'You can only delete draft timesheets'
        });
      }
    }

    const { error } = await supabase
      .from('timesheets')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      message: 'Timesheet deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;