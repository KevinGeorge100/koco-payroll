-- Update employees table to include salary information
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS base_salary DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(8,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS salary_type VARCHAR(20) DEFAULT 'monthly' CHECK (salary_type IN ('monthly', 'hourly')),
ADD COLUMN IF NOT EXISTS working_days_per_month INTEGER DEFAULT 22;

-- Create payroll table for monthly salary records
CREATE TABLE IF NOT EXISTS public.payroll (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
    base_salary DECIMAL(10,2) NOT NULL DEFAULT 0,
    bonuses DECIMAL(10,2) DEFAULT 0,
    deductions DECIMAL(10,2) DEFAULT 0,
    overtime_hours DECIMAL(5,2) DEFAULT 0,
    overtime_rate DECIMAL(8,2) DEFAULT 0,
    overtime_amount DECIMAL(10,2) DEFAULT 0,
    attendance_days INTEGER DEFAULT 0,
    working_days INTEGER DEFAULT 22,
    leave_days INTEGER DEFAULT 0,
    attendance_adjustment DECIMAL(10,2) DEFAULT 0,
    gross_salary DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_deduction DECIMAL(10,2) DEFAULT 0,
    net_salary DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'calculated', 'approved', 'paid')),
    calculated_by UUID REFERENCES auth.users(id),
    approved_by UUID REFERENCES auth.users(id),
    notes TEXT,
    calculated_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    CONSTRAINT unique_employee_month_year UNIQUE (employee_id, year, month)
);

-- Create bonuses table for tracking individual bonuses
CREATE TABLE IF NOT EXISTS public.bonuses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT NOT NULL,
    bonus_type VARCHAR(20) DEFAULT 'performance' CHECK (bonus_type IN ('performance', 'attendance', 'holiday', 'project', 'other')),
    date_awarded DATE NOT NULL DEFAULT CURRENT_DATE,
    month_applied INTEGER CHECK (month_applied >= 1 AND month_applied <= 12),
    year_applied INTEGER,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'applied')),
    awarded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create deductions table for tracking individual deductions
CREATE TABLE IF NOT EXISTS public.deductions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    reason TEXT NOT NULL,
    deduction_type VARCHAR(20) DEFAULT 'other' CHECK (deduction_type IN ('tax', 'insurance', 'loan', 'advance', 'disciplinary', 'other')),
    date_applied DATE NOT NULL DEFAULT CURRENT_DATE,
    month_applied INTEGER CHECK (month_applied >= 1 AND month_applied <= 12),
    year_applied INTEGER,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'applied')),
    applied_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payroll_employee_id ON public.payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_year_month ON public.payroll(year, month);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON public.payroll(status);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_year_month ON public.payroll(employee_id, year, month);

CREATE INDEX IF NOT EXISTS idx_bonuses_employee_id ON public.bonuses(employee_id);
CREATE INDEX IF NOT EXISTS idx_bonuses_year_month ON public.bonuses(year_applied, month_applied);
CREATE INDEX IF NOT EXISTS idx_bonuses_status ON public.bonuses(status);

CREATE INDEX IF NOT EXISTS idx_deductions_employee_id ON public.deductions(employee_id);
CREATE INDEX IF NOT EXISTS idx_deductions_year_month ON public.deductions(year_applied, month_applied);
CREATE INDEX IF NOT EXISTS idx_deductions_status ON public.deductions(status);

-- Enable RLS (Row Level Security)
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deductions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payroll table
CREATE POLICY "Authenticated users can view payroll" ON public.payroll
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert payroll" ON public.payroll
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update payroll" ON public.payroll
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete payroll" ON public.payroll
    FOR DELETE USING (auth.role() = 'authenticated');

-- RLS Policies for bonuses table
CREATE POLICY "Authenticated users can view bonuses" ON public.bonuses
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage bonuses" ON public.bonuses
    FOR ALL USING (auth.role() = 'authenticated');

-- RLS Policies for deductions table
CREATE POLICY "Authenticated users can view deductions" ON public.deductions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage deductions" ON public.deductions
    FOR ALL USING (auth.role() = 'authenticated');

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payroll_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_payroll_updated_at 
    BEFORE UPDATE ON public.payroll 
    FOR EACH ROW EXECUTE FUNCTION update_payroll_updated_at();

CREATE TRIGGER update_bonuses_updated_at 
    BEFORE UPDATE ON public.bonuses 
    FOR EACH ROW EXECUTE FUNCTION update_payroll_updated_at();

CREATE TRIGGER update_deductions_updated_at 
    BEFORE UPDATE ON public.deductions 
    FOR EACH ROW EXECUTE FUNCTION update_payroll_updated_at();

-- Function to calculate attendance-based salary adjustment
CREATE OR REPLACE FUNCTION calculate_attendance_adjustment(
    p_employee_id UUID,
    p_year INTEGER,
    p_month INTEGER,
    p_base_salary DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
    attendance_days INTEGER := 0;
    leave_days INTEGER := 0;
    working_days INTEGER := 22; -- Default working days per month
    adjustment_amount DECIMAL := 0;
    daily_rate DECIMAL;
BEGIN
    -- Get working days for the employee (from employee record or default)
    SELECT COALESCE(e.working_days_per_month, 22) 
    INTO working_days
    FROM public.employees e 
    WHERE e.id = p_employee_id;
    
    -- Count attendance days for the month
    SELECT COUNT(*)
    INTO attendance_days
    FROM public.attendance a
    WHERE a.employee_id = p_employee_id
    AND EXTRACT(YEAR FROM a.date) = p_year
    AND EXTRACT(MONTH FROM a.date) = p_month
    AND a.status IN ('Present', 'Half Day', 'Late');
    
    -- Count approved leave days for the month
    SELECT COALESCE(SUM(
        CASE 
            WHEN l.start_date < DATE(p_year || '-' || p_month || '-01') THEN
                -- Leave starts before this month
                CASE 
                    WHEN l.end_date >= DATE(p_year || '-' || p_month || '-01') + INTERVAL '1 month' - INTERVAL '1 day' THEN
                        -- Leave extends beyond this month - count all days in month
                        EXTRACT(DAY FROM DATE(p_year || '-' || p_month || '-01') + INTERVAL '1 month' - INTERVAL '1 day')
                    ELSE
                        -- Leave ends in this month
                        EXTRACT(DAY FROM l.end_date) 
                END
            ELSE
                -- Leave starts in this month
                CASE 
                    WHEN l.end_date >= DATE(p_year || '-' || p_month || '-01') + INTERVAL '1 month' - INTERVAL '1 day' THEN
                        -- Leave extends beyond this month
                        EXTRACT(DAY FROM DATE(p_year || '-' || p_month || '-01') + INTERVAL '1 month' - INTERVAL '1 day') - EXTRACT(DAY FROM l.start_date) + 1
                    ELSE
                        -- Leave ends in this month
                        l.days_requested
                END
        END
    ), 0)
    INTO leave_days
    FROM public.leaves l
    WHERE l.employee_id = p_employee_id
    AND l.status = 'Approved'
    AND (
        (l.start_date <= DATE(p_year || '-' || p_month || '-01') + INTERVAL '1 month' - INTERVAL '1 day')
        AND (l.end_date >= DATE(p_year || '-' || p_month || '-01'))
    );
    
    -- Calculate daily rate
    daily_rate := p_base_salary / working_days;
    
    -- Calculate adjustment (deduct for absent days, don't deduct for approved leaves)
    -- Total days present should include attendance + approved leaves
    IF (attendance_days + leave_days) < working_days THEN
        adjustment_amount := daily_rate * (working_days - attendance_days - leave_days) * -1; -- Negative for deduction
    END IF;
    
    RETURN adjustment_amount;
END;
$$ language 'plpgsql';

-- Function to calculate monthly payroll for an employee
CREATE OR REPLACE FUNCTION calculate_monthly_payroll(
    p_employee_id UUID,
    p_year INTEGER,
    p_month INTEGER
)
RETURNS UUID AS $$
DECLARE
    payroll_id UUID;
    employee_base_salary DECIMAL;
    total_bonuses DECIMAL := 0;
    total_deductions DECIMAL := 0;
    attendance_adj DECIMAL := 0;
    gross_sal DECIMAL;
    tax_ded DECIMAL := 0;
    net_sal DECIMAL;
    att_days INTEGER := 0;
    work_days INTEGER := 22;
    lv_days INTEGER := 0;
BEGIN
    -- Get employee base salary
    SELECT COALESCE(base_salary, 0), COALESCE(working_days_per_month, 22)
    INTO employee_base_salary, work_days
    FROM public.employees 
    WHERE id = p_employee_id;
    
    -- Calculate total bonuses for the month
    SELECT COALESCE(SUM(amount), 0)
    INTO total_bonuses
    FROM public.bonuses
    WHERE employee_id = p_employee_id
    AND year_applied = p_year
    AND month_applied = p_month
    AND status = 'approved';
    
    -- Calculate total deductions for the month
    SELECT COALESCE(SUM(amount), 0)
    INTO total_deductions
    FROM public.deductions
    WHERE employee_id = p_employee_id
    AND year_applied = p_year
    AND month_applied = p_month
    AND status = 'approved';
    
    -- Calculate attendance adjustment
    attendance_adj := calculate_attendance_adjustment(p_employee_id, p_year, p_month, employee_base_salary);
    
    -- Get actual attendance and leave days for record
    SELECT COUNT(*)
    INTO att_days
    FROM public.attendance a
    WHERE a.employee_id = p_employee_id
    AND EXTRACT(YEAR FROM a.date) = p_year
    AND EXTRACT(MONTH FROM a.date) = p_month
    AND a.status IN ('Present', 'Half Day', 'Late');
    
    -- Calculate gross salary
    gross_sal := employee_base_salary + total_bonuses - total_deductions + attendance_adj;
    
    -- Calculate tax (simplified - 10% if salary > 50000, 5% otherwise)
    IF gross_sal > 50000 THEN
        tax_ded := gross_sal * 0.10;
    ELSIF gross_sal > 25000 THEN
        tax_ded := gross_sal * 0.05;
    ELSE
        tax_ded := 0;
    END IF;
    
    -- Calculate net salary
    net_sal := gross_sal - tax_ded;
    
    -- Insert or update payroll record
    INSERT INTO public.payroll (
        employee_id, year, month, base_salary, bonuses, deductions,
        attendance_days, working_days, leave_days, attendance_adjustment,
        gross_salary, tax_deduction, net_salary, status, calculated_by, calculated_at
    ) VALUES (
        p_employee_id, p_year, p_month, employee_base_salary, total_bonuses, total_deductions,
        att_days, work_days, lv_days, attendance_adj,
        gross_sal, tax_ded, net_sal, 'calculated', auth.uid(), TIMEZONE('utc'::text, NOW())
    )
    ON CONFLICT (employee_id, year, month) 
    DO UPDATE SET
        base_salary = EXCLUDED.base_salary,
        bonuses = EXCLUDED.bonuses,
        deductions = EXCLUDED.deductions,
        attendance_days = EXCLUDED.attendance_days,
        working_days = EXCLUDED.working_days,
        leave_days = EXCLUDED.leave_days,
        attendance_adjustment = EXCLUDED.attendance_adjustment,
        gross_salary = EXCLUDED.gross_salary,
        tax_deduction = EXCLUDED.tax_deduction,
        net_salary = EXCLUDED.net_salary,
        status = 'calculated',
        calculated_by = auth.uid(),
        calculated_at = TIMEZONE('utc'::text, NOW()),
        updated_at = TIMEZONE('utc'::text, NOW())
    RETURNING id INTO payroll_id;
    
    -- Mark applied bonuses and deductions as 'applied'
    UPDATE public.bonuses 
    SET status = 'applied' 
    WHERE employee_id = p_employee_id 
    AND year_applied = p_year 
    AND month_applied = p_month 
    AND status = 'approved';
    
    UPDATE public.deductions 
    SET status = 'applied' 
    WHERE employee_id = p_employee_id 
    AND year_applied = p_year 
    AND month_applied = p_month 
    AND status = 'approved';
    
    RETURN payroll_id;
END;
$$ language 'plpgsql';

-- Insert sample data (optional)
-- Update existing employees with salary information
UPDATE public.employees 
SET base_salary = 50000, salary_type = 'monthly', working_days_per_month = 22
WHERE base_salary IS NULL OR base_salary = 0;