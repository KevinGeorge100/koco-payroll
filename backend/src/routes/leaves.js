import express from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';

const router = express.Router();

// Validation middleware
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// GET /api/leaves - Get leave requests with filtering and pagination
router.get('/', [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn(['Pending', 'Approved', 'Rejected']),
  query('employee_id').optional().isUUID(),
  query('leave_type').optional().isIn(['Annual', 'Sick', 'Personal', 'Emergency', 'Maternity', 'Paternity', 'Other']),
  query('start_date').optional().isISO8601(),
  query('end_date').optional().isISO8601(),
  query('search').optional().isString().trim(),
  validateRequest
], async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      status, 
      employee_id, 
      leave_type, 
      start_date, 
      end_date, 
      search 
    } = req.query;

    let query = supabase
      .from('leaves')
      .select(`
        *,
        employees:employee_id (
          id,
          first_name,
          last_name,
          email,
          employee_id
        ),
        reviewer:reviewed_by (
          email
        )
      `);

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (employee_id) {
      query = query.eq('employee_id', employee_id);
    }

    if (leave_type) {
      query = query.eq('leave_type', leave_type);
    }

    if (start_date) {
      query = query.gte('start_date', start_date);
    }

    if (end_date) {
      query = query.lte('end_date', end_date);
    }

    if (search) {
      query = query.or(`reason.ilike.%${search}%,admin_notes.ilike.%${search}%`);
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('leaves')
      .select('*', { count: 'exact', head: true });

    // Apply pagination and ordering
    const offset = (page - 1) * limit;
    query = query
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: leaves, error } = await query;

    if (error) {
      throw error;
    }

    res.json({
      data: leaves,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching leaves:', error);
    res.status(500).json({ error: 'Failed to fetch leave requests' });
  }
});

// GET /api/leaves/:id - Get specific leave request
router.get('/:id', [
  param('id').isUUID(),
  validateRequest
], async (req, res) => {
  try {
    const { id } = req.params;

    const { data: leave, error } = await supabase
      .from('leaves')
      .select(`
        *,
        employees:employee_id (
          id,
          first_name,
          last_name,
          email,
          employee_id
        ),
        reviewer:reviewed_by (
          email
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Leave request not found' });
      }
      throw error;
    }

    res.json({ data: leave });
  } catch (error) {
    console.error('Error fetching leave:', error);
    res.status(500).json({ error: 'Failed to fetch leave request' });
  }
});

// POST /api/leaves - Submit new leave request
router.post('/', [
  body('employee_id').isUUID().withMessage('Valid employee ID is required'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('end_date').isISO8601().withMessage('Valid end date is required'),
  body('leave_type').isIn(['Annual', 'Sick', 'Personal', 'Emergency', 'Maternity', 'Paternity', 'Other'])
    .withMessage('Valid leave type is required'),
  body('reason').isString().trim().isLength({ min: 10, max: 1000 })
    .withMessage('Reason must be between 10 and 1000 characters'),
  validateRequest
], async (req, res) => {
  try {
    const { employee_id, start_date, end_date, leave_type, reason } = req.body;

    // Validate date range
    const startDateObj = new Date(start_date);
    const endDateObj = new Date(end_date);
    
    if (endDateObj < startDateObj) {
      return res.status(400).json({ 
        error: 'End date must be after or equal to start date' 
      });
    }

    // Check for overlapping leave requests
    const { data: overlapping, error: overlapError } = await supabase
      .from('leaves')
      .select('id')
      .eq('employee_id', employee_id)
      .eq('status', 'Approved')
      .or(`start_date.lte.${end_date},end_date.gte.${start_date}`);

    if (overlapError) {
      throw overlapError;
    }

    if (overlapping && overlapping.length > 0) {
      return res.status(400).json({ 
        error: 'Leave request overlaps with existing approved leave' 
      });
    }

    const { data: leave, error } = await supabase
      .from('leaves')
      .insert([{
        employee_id,
        start_date,
        end_date,
        leave_type,
        reason,
        status: 'Pending'
      }])
      .select(`
        *,
        employees:employee_id (
          id,
          first_name,
          last_name,
          email,
          employee_id
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json({ 
      data: leave,
      message: 'Leave request submitted successfully' 
    });
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ error: 'Failed to submit leave request' });
  }
});

// PUT /api/leaves/:id/approve - Approve leave request
router.put('/:id/approve', [
  param('id').isUUID(),
  body('admin_notes').optional().isString().trim().isLength({ max: 500 }),
  validateRequest
], async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    const { data: leave, error } = await supabase
      .from('leaves')
      .update({
        status: 'Approved',
        admin_notes: admin_notes || null
      })
      .eq('id', id)
      .eq('status', 'Pending') // Only allow approving pending requests
      .select(`
        *,
        employees:employee_id (
          id,
          first_name,
          last_name,
          email,
          employee_id
        )
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          error: 'Leave request not found or already processed' 
        });
      }
      throw error;
    }

    res.json({ 
      data: leave,
      message: 'Leave request approved successfully' 
    });
  } catch (error) {
    console.error('Error approving leave:', error);
    res.status(500).json({ error: 'Failed to approve leave request' });
  }
});

// PUT /api/leaves/:id/reject - Reject leave request
router.put('/:id/reject', [
  param('id').isUUID(),
  body('admin_notes').isString().trim().isLength({ min: 10, max: 500 })
    .withMessage('Rejection reason (admin notes) is required and must be 10-500 characters'),
  validateRequest
], async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_notes } = req.body;

    const { data: leave, error } = await supabase
      .from('leaves')
      .update({
        status: 'Rejected',
        admin_notes
      })
      .eq('id', id)
      .eq('status', 'Pending') // Only allow rejecting pending requests
      .select(`
        *,
        employees:employee_id (
          id,
          first_name,
          last_name,
          email,
          employee_id
        )
      `)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ 
          error: 'Leave request not found or already processed' 
        });
      }
      throw error;
    }

    res.json({ 
      data: leave,
      message: 'Leave request rejected successfully' 
    });
  } catch (error) {
    console.error('Error rejecting leave:', error);
    res.status(500).json({ error: 'Failed to reject leave request' });
  }
});

// DELETE /api/leaves/:id - Delete leave request (Admin only)
router.delete('/:id', [
  param('id').isUUID(),
  validateRequest
], async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('leaves')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    res.json({ message: 'Leave request deleted successfully' });
  } catch (error) {
    console.error('Error deleting leave:', error);
    res.status(500).json({ error: 'Failed to delete leave request' });
  }
});

// GET /api/leaves/employee/:employee_id - Get leave requests for specific employee
router.get('/employee/:employee_id', [
  param('employee_id').isUUID(),
  query('status').optional().isIn(['Pending', 'Approved', 'Rejected']),
  query('year').optional().isInt({ min: 2020, max: 2030 }).toInt(),
  validateRequest
], async (req, res) => {
  try {
    const { employee_id } = req.params;
    const { status, year } = req.query;

    let query = supabase
      .from('leaves')
      .select('*')
      .eq('employee_id', employee_id);

    if (status) {
      query = query.eq('status', status);
    }

    if (year) {
      const startOfYear = `${year}-01-01`;
      const endOfYear = `${year}-12-31`;
      query = query.gte('start_date', startOfYear).lte('start_date', endOfYear);
    }

    query = query.order('start_date', { ascending: false });

    const { data: leaves, error } = await query;

    if (error) {
      throw error;
    }

    res.json({ data: leaves });
  } catch (error) {
    console.error('Error fetching employee leaves:', error);
    res.status(500).json({ error: 'Failed to fetch employee leave requests' });
  }
});

// GET /api/leaves/summary - Get leave summary statistics
router.get('/summary/stats', async (req, res) => {
  try {
    const { data: summary, error } = await supabase
      .rpc('get_leave_summary');

    if (error) {
      // If RPC doesn't exist, fall back to basic queries
      const [
        { count: totalRequests },
        { count: pendingRequests },
        { count: approvedRequests },
        { count: rejectedRequests }
      ] = await Promise.all([
        supabase.from('leaves').select('*', { count: 'exact', head: true }),
        supabase.from('leaves').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
        supabase.from('leaves').select('*', { count: 'exact', head: true }).eq('status', 'Approved'),
        supabase.from('leaves').select('*', { count: 'exact', head: true }).eq('status', 'Rejected')
      ]);

      return res.json({
        data: {
          total_requests: totalRequests,
          pending_requests: pendingRequests,
          approved_requests: approvedRequests,
          rejected_requests: rejectedRequests
        }
      });
    }

    res.json({ data: summary });
  } catch (error) {
    console.error('Error fetching leave summary:', error);
    res.status(500).json({ error: 'Failed to fetch leave summary' });
  }
});

export default router;