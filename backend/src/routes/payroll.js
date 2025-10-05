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

// Get all payroll records (HR and Admin only)
router.get('/', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('period').optional().trim(),
  query('year').optional().isInt({ min: 2020 }),
  query('status').optional().isIn(['draft', 'processed', 'paid'])
], validateRequest, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { period, year, status } = req.query;

    let query = supabase
      .from('payroll_records')
      .select(`
        *,
        employees(first_name, last_name, employee_number)
      `, { count: 'exact' });

    // Apply filters
    if (period) {
      query = query.eq('pay_period', period);
    }
    
    if (year) {
      query = query.eq('pay_year', year);
    }
    
    if (status) {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)
                  .order('created_at', { ascending: false });

    const { data: payrollRecords, error, count } = await query;

    if (error) throw error;

    res.json({
      payrollRecords,
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

// Get payroll record by ID
router.get('/:id', [
  param('id').isUUID()
], validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: payrollRecord, error } = await supabase
      .from('payroll_records')
      .select(`
        *,
        employees(first_name, last_name, employee_number, salary)
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Payroll record not found'
        });
      }
      throw error;
    }

    // Check permissions - employees can only view their own records
    if (req.userRole === 'employee' && payrollRecord.employee_id !== req.user.id) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own payroll records'
      });
    }

    res.json({ payrollRecord });
  } catch (error) {
    next(error);
  }
});

// Get employee's payroll history
router.get('/employee/:employeeId', [
  param('employeeId').isUUID(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], validateRequest, async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Check permissions
    if (req.userRole === 'employee' && req.user.id !== employeeId) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own payroll records'
      });
    }

    const { data: payrollRecords, error, count } = await supabase
      .from('payroll_records')
      .select('*', { count: 'exact' })
      .eq('employee_id', employeeId)
      .range(offset, offset + limit - 1)
      .order('pay_period_start', { ascending: false });

    if (error) throw error;

    res.json({
      payrollRecords,
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

// Create payroll record (HR and Admin only)
router.post('/', [
  body('employeeId').isUUID(),
  body('payPeriodStart').isISO8601(),
  body('payPeriodEnd').isISO8601(),
  body('hoursWorked').isFloat({ min: 0 }),
  body('overtimeHours').optional().isFloat({ min: 0 }),
  body('bonuses').optional().isFloat({ min: 0 }),
  body('deductions').optional().isFloat({ min: 0 }),
  body('taxDeductions').optional().isFloat({ min: 0 })
], validateRequest, async (req, res, next) => {
  try {
    const {
      employeeId,
      payPeriodStart,
      payPeriodEnd,
      hoursWorked,
      overtimeHours = 0,
      bonuses = 0,
      deductions = 0,
      taxDeductions = 0
    } = req.body;

    // Get employee details
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('salary')
      .eq('id', employeeId)
      .single();

    if (empError || !employee) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Employee not found'
      });
    }

    // Calculate pay amounts
    const hourlyRate = employee.salary / (52 * 40); // Assuming 40 hours/week
    const regularPay = Math.min(hoursWorked, 40) * hourlyRate;
    const overtimePay = overtimeHours * hourlyRate * 1.5;
    const grossPay = regularPay + overtimePay + bonuses;
    const netPay = grossPay - deductions - taxDeductions;

    const payrollData = {
      employee_id: employeeId,
      pay_period_start: payPeriodStart,
      pay_period_end: payPeriodEnd,
      pay_period: new Date(payPeriodStart).toISOString().slice(0, 7), // YYYY-MM format
      pay_year: new Date(payPeriodStart).getFullYear(),
      hours_worked: hoursWorked,
      overtime_hours: overtimeHours,
      hourly_rate: hourlyRate,
      regular_pay: regularPay,
      overtime_pay: overtimePay,
      bonuses,
      gross_pay: grossPay,
      tax_deductions: taxDeductions,
      other_deductions: deductions,
      net_pay: netPay,
      status: 'draft',
      created_by: req.user.id
    };

    const { data: payrollRecord, error } = await supabase
      .from('payroll_records')
      .insert(payrollData)
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      message: 'Payroll record created successfully',
      payrollRecord
    });
  } catch (error) {
    next(error);
  }
});

// Process payroll (HR and Admin only)
router.patch('/:id/process', [
  param('id').isUUID()
], validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: payrollRecord, error } = await supabase
      .from('payroll_records')
      .update({
        status: 'processed',
        processed_at: new Date().toISOString(),
        processed_by: req.user.id
      })
      .eq('id', id)
      .eq('status', 'draft')
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Payroll record not found or already processed'
        });
      }
      throw error;
    }

    res.json({
      message: 'Payroll record processed successfully',
      payrollRecord
    });
  } catch (error) {
    next(error);
  }
});

// Mark payroll as paid (HR and Admin only)
router.patch('/:id/pay', [
  param('id').isUUID()
], validateRequest, async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data: payrollRecord, error } = await supabase
      .from('payroll_records')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        paid_by: req.user.id
      })
      .eq('id', id)
      .eq('status', 'processed')
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Payroll record not found or not ready for payment'
        });
      }
      throw error;
    }

    res.json({
      message: 'Payroll record marked as paid successfully',
      payrollRecord
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/payroll/calculate - Calculate monthly payroll for employees
router.post('/calculate', [
  body('year').isInt({ min: 2020, max: 2030 }).withMessage('Valid year is required'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Valid month is required'),
  body('employee_ids').optional().isArray().withMessage('Employee IDs must be an array'),
  body('employee_ids.*').optional().isUUID().withMessage('Each employee ID must be a valid UUID'),
  validateRequest
], async (req, res) => {
  try {
    const { year, month, employee_ids } = req.body;

    let employeesToProcess = [];

    if (employee_ids && employee_ids.length > 0) {
      // Calculate for specific employees
      employeesToProcess = employee_ids;
    } else {
      // Calculate for all employees
      const { data: employees, error: employeesError } = await supabase
        .from('employees')
        .select('id')
        .eq('status', 'active');

      if (employeesError) {
        throw employeesError;
      }

      employeesToProcess = employees.map(emp => emp.id);
    }

    const results = [];
    const errors = [];

    // Process each employee
    for (const employeeId of employeesToProcess) {
      try {
        const { data, error } = await supabase
          .rpc('calculate_monthly_payroll', {
            p_employee_id: employeeId,
            p_year: year,
            p_month: month
          });

        if (error) {
          errors.push({ employee_id: employeeId, error: error.message });
        } else {
          results.push({ employee_id: employeeId, payroll_id: data });
        }
      } catch (error) {
        errors.push({ employee_id: employeeId, error: error.message });
      }
    }

    res.json({
      message: 'Payroll calculation completed',
      successful: results.length,
      failed: errors.length,
      results,
      errors
    });
  } catch (error) {
    console.error('Error calculating payroll:', error);
    res.status(500).json({ error: 'Failed to calculate payroll' });
  }
});

// GET /api/payroll/summary/:year/:month - Get payroll summary for a specific month
router.get('/summary/:year/:month', [
  param('year').isInt({ min: 2020, max: 2030 }),
  param('month').isInt({ min: 1, max: 12 }),
  validateRequest
], async (req, res) => {
  try {
    const { year, month } = req.params;

    const { data: summary, error } = await supabase
      .from('payroll')
      .select(`
        status,
        gross_salary,
        net_salary,
        tax_deduction,
        employee_id
      `)
      .eq('year', parseInt(year))
      .eq('month', parseInt(month));

    if (error) {
      throw error;
    }

    // Calculate summary statistics
    const stats = {
      total_employees: summary.length,
      total_gross_salary: summary.reduce((sum, record) => sum + parseFloat(record.gross_salary || 0), 0),
      total_net_salary: summary.reduce((sum, record) => sum + parseFloat(record.net_salary || 0), 0),
      total_tax_deduction: summary.reduce((sum, record) => sum + parseFloat(record.tax_deduction || 0), 0),
      status_breakdown: {
        draft: summary.filter(r => r.status === 'draft').length,
        calculated: summary.filter(r => r.status === 'calculated').length,
        approved: summary.filter(r => r.status === 'approved').length,
        paid: summary.filter(r => r.status === 'paid').length
      }
    };

    res.json({ data: stats });
  } catch (error) {
    console.error('Error fetching payroll summary:', error);
    res.status(500).json({ error: 'Failed to fetch payroll summary' });
  }
});

export default router;
