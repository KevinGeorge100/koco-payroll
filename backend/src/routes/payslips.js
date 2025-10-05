import express from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { supabase } from '../config/supabase.js';
import moment from 'moment';

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

// Calculate payslip data for an employee for a specific month/year
router.get('/employee/:employeeId/:year/:month', [
  param('employeeId').isUUID(),
  param('year').isInt({ min: 2020, max: 2030 }),
  param('month').isInt({ min: 1, max: 12 })
], validateRequest, async (req, res, next) => {
  try {
    const { employeeId, year, month } = req.params;
    
    // Get employee basic information
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select(`
        *,
        departments(name),
        positions(title)
      `)
      .eq('id', employeeId)
      .single();

    if (empError) {
      return res.status(404).json({
        error: 'Employee not found',
        message: empError.message
      });
    }

    // Calculate date range for the month
    const startDate = moment(`${year}-${month.toString().padStart(2, '0')}-01`).startOf('month');
    const endDate = moment(startDate).endOf('month');

    // Get attendance data for the month
    const { data: attendance, error: attError } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('date', startDate.format('YYYY-MM-DD'))
      .lte('date', endDate.format('YYYY-MM-DD'));

    // Get leave data for the month
    const { data: leaves, error: leaveError } = await supabase
      .from('leaves')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('start_date', startDate.format('YYYY-MM-DD'))
      .lte('end_date', endDate.format('YYYY-MM-DD'))
      .eq('status', 'approved');

    // Calculate payroll metrics
    const totalWorkingDays = startDate.daysInMonth();
    const weekends = [];
    for (let i = 0; i < totalWorkingDays; i++) {
      const day = moment(startDate).add(i, 'days');
      if (day.day() === 0 || day.day() === 6) { // Sunday = 0, Saturday = 6
        weekends.push(day.format('YYYY-MM-DD'));
      }
    }
    
    const workingDays = totalWorkingDays - weekends.length;
    const attendedDays = attendance ? attendance.filter(a => a.status === 'present').length : 0;
    const absentDays = workingDays - attendedDays;
    const leaveDays = leaves ? leaves.reduce((total, leave) => {
      const leaveStart = moment.max(moment(leave.start_date), startDate);
      const leaveEnd = moment.min(moment(leave.end_date), endDate);
      return total + leaveEnd.diff(leaveStart, 'days') + 1;
    }, 0) : 0;

    // Calculate salary breakdown
    const baseSalary = parseFloat(employee.base_salary) || parseFloat(employee.salary) || 0;
    const monthlyBasic = baseSalary;
    
    // Standard deductions and allowances (you can customize these)
    const hra = monthlyBasic * 0.40; // 40% of basic as HRA
    const da = monthlyBasic * 0.12; // 12% as Dearness Allowance
    const medicalAllowance = 1250; // Fixed medical allowance
    const conveyanceAllowance = 1600; // Fixed conveyance allowance
    
    const grossSalary = monthlyBasic + hra + da + medicalAllowance + conveyanceAllowance;
    
    // Deductions
    const pf = monthlyBasic * 0.12; // 12% PF deduction
    const esi = grossSalary * 0.0175; // 1.75% ESI (if applicable)
    const professionalTax = grossSalary > 10000 ? 200 : 0;
    const incomeTax = calculateIncomeTax(grossSalary * 12) / 12; // Simplified calculation
    
    // Apply attendance-based deductions
    const attendancePercentage = workingDays > 0 ? (attendedDays / workingDays) : 1;
    const salaryAfterAttendance = grossSalary * attendancePercentage;
    
    const totalDeductions = pf + esi + professionalTax + incomeTax;
    const netSalary = salaryAfterAttendance - totalDeductions;

    // Prepare payslip data
    const payslipData = {
      employee: {
        id: employee.id,
        employeeNumber: employee.employee_number,
        firstName: employee.first_name,
        lastName: employee.last_name,
        email: employee.email,
        designation: employee.positions?.title || 'N/A',
        department: employee.departments?.name || 'N/A',
        joiningDate: employee.hire_date,
        bankAccount: employee.bank_details || {}
      },
      payPeriod: {
        month: parseInt(month),
        year: parseInt(year),
        monthName: startDate.format('MMMM'),
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD')
      },
      attendance: {
        totalWorkingDays: workingDays,
        attendedDays,
        absentDays,
        leaveDays,
        weekends: weekends.length,
        attendancePercentage: Math.round(attendancePercentage * 100)
      },
      earnings: {
        basicSalary: Math.round(monthlyBasic),
        hra: Math.round(hra),
        da: Math.round(da),
        medicalAllowance: Math.round(medicalAllowance),
        conveyanceAllowance: Math.round(conveyanceAllowance),
        grossSalary: Math.round(grossSalary),
        salaryAfterAttendance: Math.round(salaryAfterAttendance)
      },
      deductions: {
        pf: Math.round(pf),
        esi: Math.round(esi),
        professionalTax: Math.round(professionalTax),
        incomeTax: Math.round(incomeTax),
        totalDeductions: Math.round(totalDeductions)
      },
      netSalary: Math.round(netSalary),
      generatedAt: new Date().toISOString()
    };

    res.status(200).json({
      message: 'Payslip data retrieved successfully',
      payslip: payslipData
    });

  } catch (error) {
    console.error('Payslip generation error:', error);
    next(error);
  }
});

// Get all payslips for an employee
router.get('/employee/:employeeId', [
  param('employeeId').isUUID(),
  query('limit').optional().isInt({ min: 1, max: 50 })
], validateRequest, async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const limit = parseInt(req.query.limit) || 12;

    // Get employee information
    const { data: employee, error: empError } = await supabase
      .from('employees')
      .select('first_name, last_name, hire_date')
      .eq('id', employeeId)
      .single();

    if (empError) {
      return res.status(404).json({
        error: 'Employee not found',
        message: empError.message
      });
    }

    // Generate list of available payslips (last 12 months by default)
    const availablePayslips = [];
    const currentDate = moment();
    
    for (let i = 0; i < limit; i++) {
      const payslipDate = moment(currentDate).subtract(i, 'months');
      const hireDate = moment(employee.hire_date);
      
      if (payslipDate.isAfter(hireDate) || payslipDate.isSame(hireDate, 'month')) {
        availablePayslips.push({
          year: payslipDate.year(),
          month: payslipDate.month() + 1,
          monthName: payslipDate.format('MMMM'),
          period: payslipDate.format('MMMM YYYY')
        });
      }
    }

    res.status(200).json({
      message: 'Available payslips retrieved successfully',
      employee: {
        name: `${employee.first_name} ${employee.last_name}`,
        hireDate: employee.hire_date
      },
      payslips: availablePayslips
    });

  } catch (error) {
    console.error('Payslip list error:', error);
    next(error);
  }
});

// Simple income tax calculation (simplified for demo)
function calculateIncomeTax(annualIncome) {
  // Basic tax slabs (simplified)
  if (annualIncome <= 250000) return 0;
  if (annualIncome <= 500000) return (annualIncome - 250000) * 0.05;
  if (annualIncome <= 1000000) return 12500 + (annualIncome - 500000) * 0.20;
  return 112500 + (annualIncome - 1000000) * 0.30;
}

export default router;