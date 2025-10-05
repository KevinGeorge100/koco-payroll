import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Middleware to validate request
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array()
    });
  }
  next();
};

// Note: Authentication is handled at the app level, not route level

// GET /attendance - Get attendance records with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('employee_id').optional().isUUID(),
  query('date').optional().isISO8601(),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  query('status').optional().isIn(['Present', 'Absent', 'Leave', 'Half Day', 'Late']),
  query('search').optional().trim()
], validateRequest, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('attendance')
      .select(`
        *,
        employees!attendance_employee_id_fkey(
          id,
          first_name,
          last_name,
          employee_number
        )
      `, { count: 'exact' });

    // Apply filters
    if (req.query.employee_id) {
      query = query.eq('employee_id', req.query.employee_id);
    }

    if (req.query.date) {
      query = query.eq('date', req.query.date);
    }

    if (req.query.start_date && req.query.end_date) {
      query = query.gte('date', req.query.start_date).lte('date', req.query.end_date);
    } else if (req.query.start_date) {
      query = query.gte('date', req.query.start_date);
    } else if (req.query.end_date) {
      query = query.lte('date', req.query.end_date);
    }

    if (req.query.status) {
      query = query.eq('status', req.query.status);
    }

    // Search functionality
    if (req.query.search) {
      query = query.or(`
        employees.first_name.ilike.%${req.query.search}%,
        employees.last_name.ilike.%${req.query.search}%,
        employees.employee_number.ilike.%${req.query.search}%
      `);
    }

    // Apply sorting and pagination
    query = query
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: attendance, error, count } = await query;

    if (error) throw error;

    res.json({
      attendance,
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

// GET /attendance/:id - Get specific attendance record
router.get('/:id', [
  param('id').isUUID()
], validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: attendance, error } = await supabase
      .from('attendance')
      .select(`
        *,
        employees!attendance_employee_id_fkey(
          id,
          first_name,
          last_name,
          employee_number
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Attendance record not found'
        });
      }
      throw error;
    }

    res.json({ attendance });
  } catch (error) {
    next(error);
  }
});

// POST /attendance - Create attendance record (HR and Admin only)
router.post('/', [
  body('employee_id').isUUID(),
  body('date').isISO8601(),
  body('status').isIn(['Present', 'Absent', 'Leave', 'Half Day', 'Late']),
  body('check_in_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/),
  body('check_out_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/),
  body('notes').optional().trim()
], validateRequest, async (req, res, next) => {
  try {
    const attendanceData = {
      employee_id: req.body.employee_id,
      date: req.body.date,
      status: req.body.status,
      check_in_time: req.body.check_in_time,
      check_out_time: req.body.check_out_time,
      notes: req.body.notes,
      marked_by: req.user.id
    };

    const { data: attendance, error } = await supabase
      .from('attendance')
      .insert(attendanceData)
      .select(`
        *,
        employees!attendance_employee_id_fkey(
          id,
          first_name,
          last_name,
          employee_number
        )
      `)
      .single();

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        return res.status(409).json({
          error: 'Conflict',
          message: 'Attendance record already exists for this employee on this date'
        });
      }
      throw error;
    }

    res.status(201).json({
      message: 'Attendance record created successfully',
      attendance
    });
  } catch (error) {
    next(error);
  }
});

// PUT /attendance/:id - Update attendance record (HR and Admin only)
router.put('/:id', [
  param('id').isUUID(),
  body('status').optional().isIn(['Present', 'Absent', 'Leave', 'Half Day', 'Late']),
  body('check_in_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/),
  body('check_out_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/),
  body('notes').optional().trim()
], validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const updateData = {};
    if (req.body.status) updateData.status = req.body.status;
    if (req.body.check_in_time !== undefined) updateData.check_in_time = req.body.check_in_time;
    if (req.body.check_out_time !== undefined) updateData.check_out_time = req.body.check_out_time;
    if (req.body.notes !== undefined) updateData.notes = req.body.notes;
    
    updateData.marked_by = req.user.id;

    const { data: attendance, error } = await supabase
      .from('attendance')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        employees!attendance_employee_id_fkey(
          id,
          first_name,
          last_name,
          employee_number
        )
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Attendance record not found'
        });
      }
      throw error;
    }

    res.json({
      message: 'Attendance record updated successfully',
      attendance
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /attendance/:id - Delete attendance record (Admin only)
router.delete('/:id', [
  param('id').isUUID()
], validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('attendance')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// POST /attendance/bulk - Bulk create attendance records (HR and Admin only)
router.post('/bulk', [
  body('attendance').isArray(),
  body('attendance.*.employee_id').isUUID(),
  body('attendance.*.date').isISO8601(),
  body('attendance.*.status').isIn(['Present', 'Absent', 'Leave', 'Half Day', 'Late']),
  body('attendance.*.check_in_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/),
  body('attendance.*.check_out_time').optional().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/),
  body('attendance.*.notes').optional().trim()
], validateRequest, async (req, res, next) => {
  try {
    const attendanceRecords = req.body.attendance.map(record => ({
      ...record,
      marked_by: req.user.id
    }));

    const { data: attendance, error } = await supabase
      .from('attendance')
      .insert(attendanceRecords)
      .select(`
        *,
        employees!attendance_employee_id_fkey(
          id,
          first_name,
          last_name,
          employee_number
        )
      `);

    if (error) throw error;

    res.status(201).json({
      message: `${attendance.length} attendance records created successfully`,
      attendance
    });
  } catch (error) {
    next(error);
  }
});

// GET /attendance/summary/:employee_id - Get attendance summary for an employee
router.get('/summary/:employee_id', [
  param('employee_id').isUUID(),
  query('month').optional().isInt({ min: 1, max: 12 }),
  query('year').optional().isInt({ min: 2020, max: 2030 })
], validateRequest, async (req, res, next) => {
  try {
    const { employee_id } = req.params;
    const month = req.query.month || new Date().getMonth() + 1;
    const year = req.query.year || new Date().getFullYear();

    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data: attendance, error } = await supabase
      .from('attendance')
      .select('status, date')
      .eq('employee_id', employee_id)
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) throw error;

    const summary = {
      total_days: attendance.length,
      present: attendance.filter(a => a.status === 'Present').length,
      absent: attendance.filter(a => a.status === 'Absent').length,
      leave: attendance.filter(a => a.status === 'Leave').length,
      half_day: attendance.filter(a => a.status === 'Half Day').length,
      late: attendance.filter(a => a.status === 'Late').length,
      month,
      year
    };

    res.json({ summary });
  } catch (error) {
    next(error);
  }
});

export default router;
