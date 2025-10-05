import { supabase } from '../lib/supabase';

export const payrollService = {
  // Get all payroll records with optional filters
  async getPayrollRecords(filters = {}) {
    let query = supabase
      .from('payroll')
      .select(`
        *,
        employee:employees(
          first_name,
          last_name,
          employee_id,
          department,
          position
        )
      `)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.year) {
      query = query.eq('year', filters.year);
    }
    if (filters.month) {
      query = query.eq('month', filters.month);
    }
    if (filters.employee_id) {
      query = query.eq('employee_id', filters.employee_id);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  // Get payroll record by ID with detailed breakdown
  async getPayrollById(id) {
    const { data, error } = await supabase
      .from('payroll')
      .select(`
        *,
        employee:employees(
          first_name,
          last_name,
          employee_id,
          department,
          position,
          base_salary,
          hourly_rate
        ),
        bonuses:bonuses(
          id,
          amount,
          description,
          bonus_type,
          created_at
        ),
        deductions:deductions(
          id,
          amount,
          description,
          deduction_type,
          created_at
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Calculate payroll for employees
  async calculatePayroll(payload) {
    const response = await fetch('/api/payroll/calculate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to calculate payroll');
    }

    return response.json();
  },

  // Get payroll summary for a specific month
  async getPayrollSummary(year, month) {
    const response = await fetch(`/api/payroll/summary/${year}/${month}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch payroll summary');
    }

    const result = await response.json();
    return result.data;
  },

  // Update payroll status
  async updatePayrollStatus(id, status) {
    const { data, error } = await supabase
      .from('payroll')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get bonuses for an employee in a specific period
  async getBonuses(employee_id, year, month) {
    const { data, error } = await supabase
      .from('bonuses')
      .select('*')
      .eq('employee_id', employee_id)
      .eq('year', year)
      .eq('month', month)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get deductions for an employee in a specific period
  async getDeductions(employee_id, year, month) {
    const { data, error } = await supabase
      .from('deductions')
      .select('*')
      .eq('employee_id', employee_id)
      .eq('year', year)
      .eq('month', month)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Add bonus to employee
  async addBonus(bonusData) {
    const { data, error } = await supabase
      .from('bonuses')
      .insert([bonusData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Add deduction to employee
  async addDeduction(deductionData) {
    const { data, error } = await supabase
      .from('deductions')
      .insert([deductionData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete bonus
  async deleteBonus(id) {
    const { error } = await supabase
      .from('bonuses')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Delete deduction
  async deleteDeduction(id) {
    const { error } = await supabase
      .from('deductions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get available years and months for payroll
  async getAvailablePeriods() {
    const { data, error } = await supabase
      .from('payroll')
      .select('year, month')
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (error) throw error;

    // Get unique year-month combinations
    const periods = [];
    const seen = new Set();

    data.forEach(record => {
      const key = `${record.year}-${record.month}`;
      if (!seen.has(key)) {
        seen.add(key);
        periods.push({
          year: record.year,
          month: record.month,
          label: `${new Date(record.year, record.month - 1).toLocaleString('default', { month: 'long' })} ${record.year}`
        });
      }
    });

    return periods;
  }
};