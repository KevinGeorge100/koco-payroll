-- COMPLETE KOCO PAYROLL DATABASE SETUP
-- Copy and paste this entire file into Supabase SQL Editor
-- This is safe to run multiple times

-- ======================================
-- 1. DEPARTMENTS TABLE
-- ======================================

CREATE TABLE IF NOT EXISTS departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    manager_id UUID, -- Will be updated after employees table is created
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================
-- 2. EMPLOYEES TABLE
-- ======================================

CREATE TABLE IF NOT EXISTS employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
    position VARCHAR(100),
    department_id UUID REFERENCES departments(id),
    salary DECIMAL(12,2),
    address TEXT,
    emergency_contact JSONB,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure position column exists in employees table (in case table was created previously without it)
DO $$ BEGIN
    ALTER TABLE employees ADD COLUMN position VARCHAR(100);
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- Add foreign key constraint to departments table after employees table exists
-- Drop constraint if it exists first, then add it
ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_manager_id_fkey;
ALTER TABLE departments 
ADD CONSTRAINT departments_manager_id_fkey 
FOREIGN KEY (manager_id) REFERENCES employees(id);

-- ======================================
-- 3. POSITIONS TABLE
-- ======================================

CREATE TABLE IF NOT EXISTS positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    department_id UUID REFERENCES departments(id),
    base_salary DECIMAL(12,2),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================
-- 4. ATTENDANCE TABLE
-- ======================================

CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    break_start_time TIMESTAMP WITH TIME ZONE,
    break_end_time TIMESTAMP WITH TIME ZONE,
    total_hours DECIMAL(4,2),
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Present' CHECK (status IN ('Present', 'Absent', 'Leave', 'Half Day', 'Late', 'Holiday')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- ======================================
-- 5. LEAVE TYPES TABLE
-- ======================================

CREATE TABLE IF NOT EXISTS leave_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    max_days_per_year INTEGER,
    is_paid BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default leave types
INSERT INTO leave_types (name, description, max_days_per_year, is_paid) VALUES
('Annual Leave', 'Yearly vacation leave', 21, true),
('Sick Leave', 'Medical leave', 10, true),
('Emergency Leave', 'Emergency situations', 3, true),
('Maternity Leave', 'Maternity leave', 90, true),
('Paternity Leave', 'Paternity leave', 10, true),
('Study Leave', 'Educational purposes', 5, false)
ON CONFLICT (name) DO NOTHING;

-- ======================================
-- 6. LEAVE REQUESTS TABLE
-- ======================================

CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    leave_type_id UUID REFERENCES leave_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Cancelled')),
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================
-- 7. PAYROLL TABLE
-- ======================================

CREATE TABLE IF NOT EXISTS payroll (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    basic_salary DECIMAL(12,2) NOT NULL,
    overtime_pay DECIMAL(12,2) DEFAULT 0,
    bonus DECIMAL(12,2) DEFAULT 0,
    allowances DECIMAL(12,2) DEFAULT 0,
    gross_pay DECIMAL(12,2) NOT NULL,
    tax_deduction DECIMAL(12,2) DEFAULT 0,
    insurance_deduction DECIMAL(12,2) DEFAULT 0,
    other_deductions DECIMAL(12,2) DEFAULT 0,
    total_deductions DECIMAL(12,2) DEFAULT 0,
    net_pay DECIMAL(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'processed', 'paid')),
    processed_by UUID REFERENCES employees(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, pay_period_start, pay_period_end)
);

-- ======================================
-- 8. USER ROLES & PERMISSIONS SYSTEM
-- ======================================

-- Create roles enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'hr', 'employee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- User profiles table to extend Supabase auth
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    role user_role DEFAULT 'employee',
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Role permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role user_role NOT NULL,
    resource TEXT NOT NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role, resource, action)
);

-- Insert default role permissions
INSERT INTO role_permissions (role, resource, action) VALUES
-- Admin permissions (full access)
('admin', 'employees', 'create'),
('admin', 'employees', 'read'),
('admin', 'employees', 'update'),
('admin', 'employees', 'delete'),
('admin', 'payroll', 'create'),
('admin', 'payroll', 'read'),
('admin', 'payroll', 'update'),
('admin', 'payroll', 'delete'),
('admin', 'payslips', 'read'),
('admin', 'payslips', 'create'),
('admin', 'attendance', 'create'),
('admin', 'attendance', 'read'),
('admin', 'attendance', 'update'),
('admin', 'attendance', 'delete'),
('admin', 'leaves', 'create'),
('admin', 'leaves', 'read'),
('admin', 'leaves', 'update'),
('admin', 'leaves', 'delete'),
('admin', 'users', 'create'),
('admin', 'users', 'read'),
('admin', 'users', 'update'),
('admin', 'users', 'delete'),

-- HR permissions
('hr', 'employees', 'create'),
('hr', 'employees', 'read'),
('hr', 'employees', 'update'),
('hr', 'payroll', 'create'),
('hr', 'payroll', 'read'),
('hr', 'payroll', 'update'),
('hr', 'payslips', 'read'),
('hr', 'payslips', 'create'),
('hr', 'attendance', 'read'),
('hr', 'attendance', 'update'),
('hr', 'leaves', 'read'),
('hr', 'leaves', 'update'),
('hr', 'users', 'read'),

-- Employee permissions
('employee', 'employees', 'read'),
('employee', 'payslips', 'read'),
('employee', 'attendance', 'read'),
('employee', 'attendance', 'create'),
('employee', 'leaves', 'create'),
('employee', 'leaves', 'read')
ON CONFLICT (role, resource, action) DO NOTHING;

-- ======================================
-- 9. FUNCTIONS FOR ROLE CHECKING
-- ======================================

-- Function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
DECLARE
    user_role_result user_role;
BEGIN
    SELECT role INTO user_role_result
    FROM user_profiles
    WHERE id = user_id AND is_active = true;
    
    RETURN COALESCE(user_role_result, 'employee');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check permissions
CREATE OR REPLACE FUNCTION has_permission(user_id UUID, resource_name TEXT, action_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_role_value user_role;
    has_perm BOOLEAN := false;
BEGIN
    SELECT get_user_role(user_id) INTO user_role_value;
    
    SELECT EXISTS(
        SELECT 1 FROM role_permissions 
        WHERE role = user_role_value 
        AND resource = resource_name 
        AND action = action_name
    ) INTO has_perm;
    
    RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ======================================
-- 10. TRIGGERS FOR UPDATED_AT
-- ======================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_positions_updated_at ON positions;
CREATE TRIGGER update_positions_updated_at
    BEFORE UPDATE ON positions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendance_updated_at ON attendance;
CREATE TRIGGER update_attendance_updated_at
    BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_leave_requests_updated_at ON leave_requests;
CREATE TRIGGER update_leave_requests_updated_at
    BEFORE UPDATE ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payroll_updated_at ON payroll;
CREATE TRIGGER update_payroll_updated_at
    BEFORE UPDATE ON payroll
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ======================================
-- 11. ROW LEVEL SECURITY POLICIES
-- ======================================

-- Enable RLS on sensitive tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- User profiles policies
DROP POLICY IF EXISTS "Users can read own profile" ON user_profiles;
CREATE POLICY "Users can read own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can manage all profiles" ON user_profiles;
CREATE POLICY "Admins can manage all profiles" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
            AND is_active = true
        )
    );

-- Employees policies
DROP POLICY IF EXISTS "HR and Admin can read all employees" ON employees;
CREATE POLICY "HR and Admin can read all employees" ON employees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'hr')
            AND is_active = true
        )
    );

DROP POLICY IF EXISTS "Employees can read own data" ON employees;
CREATE POLICY "Employees can read own data" ON employees
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND employee_id = employees.id
            AND is_active = true
        )
    );

-- ======================================
-- 12. INDEXES FOR PERFORMANCE
-- ======================================

CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_employee_number ON employees(employee_number);
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_period ON payroll(employee_id, pay_period_start, pay_period_end);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_employee_id ON user_profiles(employee_id);

-- ======================================
-- 13. SAMPLE DATA (OPTIONAL)
-- ======================================

-- Insert sample departments
INSERT INTO departments (name, description) VALUES
('Human Resources', 'Employee management and development'),
('Finance', 'Financial operations and accounting'),
('IT', 'Information technology and systems'),
('Marketing', 'Marketing and communications'),
('Operations', 'Business operations and management')
ON CONFLICT (name) DO NOTHING;

-- Insert sample employees
-- First, let's get the department IDs
DO $$
DECLARE
    it_dept_id UUID;
    hr_dept_id UUID;
    finance_dept_id UUID;
    marketing_dept_id UUID;
    operations_dept_id UUID;
BEGIN
    -- Get department IDs
    SELECT id INTO it_dept_id FROM departments WHERE name = 'IT';
    SELECT id INTO hr_dept_id FROM departments WHERE name = 'Human Resources';
    SELECT id INTO finance_dept_id FROM departments WHERE name = 'Finance';
    SELECT id INTO marketing_dept_id FROM departments WHERE name = 'Marketing';
    SELECT id INTO operations_dept_id FROM departments WHERE name = 'Operations';
    
    -- Insert sample employees with proper department references
    INSERT INTO employees (employee_number, first_name, last_name, email, position, department_id, salary, hire_date) VALUES
    ('EMP001', 'John', 'Doe', 'john.doe@kocopayroll.com', 'Software Developer', it_dept_id, 75000, '2024-01-15'),
    ('EMP002', 'Jane', 'Smith', 'jane.smith@kocopayroll.com', 'HR Manager', hr_dept_id, 85000, '2024-02-01'),
    ('EMP003', 'Mike', 'Johnson', 'mike.johnson@kocopayroll.com', 'Accountant', finance_dept_id, 65000, '2024-03-10'),
    ('EMP004', 'Sarah', 'Williams', 'sarah.williams@kocopayroll.com', 'Marketing Specialist', marketing_dept_id, 60000, '2024-04-05'),
    ('EMP005', 'David', 'Brown', 'david.brown@kocopayroll.com', 'Operations Manager', operations_dept_id, 90000, '2024-05-20')
    ON CONFLICT (employee_number) DO NOTHING;
END $$;

-- Success message
SELECT 'KOCO Payroll database setup completed successfully! 🎉' as status,
       'All tables, functions, triggers, and policies have been created.' as message;