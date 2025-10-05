-- KOCO PAYROLL - COMPLETE FRESH SETUP
-- Delete ALL existing queries first, then run this entire script
-- This creates everything from scratch for your single-owner system

-- ======================================
-- 1. DROP EXISTING TABLES (SAFETY FIRST)
-- ======================================

-- Drop tables in correct order (dependencies first)
DROP TABLE IF EXISTS timesheets CASCADE;
DROP TABLE IF EXISTS payroll CASCADE;
DROP TABLE IF EXISTS leaves CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS benefits CASCADE;
DROP TABLE IF EXISTS leave_requests CASCADE;
DROP TABLE IF EXISTS leave_types CASCADE;
DROP TABLE IF EXISTS positions CASCADE;

-- Drop any existing policies (ignore errors if tables don't exist)
DO $$ 
BEGIN
    -- Drop policies safely
    DROP POLICY IF EXISTS "Authenticated users can access" ON user_profiles;
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON user_profiles;
EXCEPTION 
    WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can access" ON employees;
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON employees;
EXCEPTION 
    WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can access" ON attendance;
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON attendance;
EXCEPTION 
    WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can access" ON leaves;
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON leaves;
EXCEPTION 
    WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can access" ON payroll;
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON payroll;
EXCEPTION 
    WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can access" ON timesheets;
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON timesheets;
EXCEPTION 
    WHEN undefined_table THEN NULL;
END $$;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Authenticated users can access" ON departments;
    DROP POLICY IF EXISTS "Allow all for authenticated users" ON departments;
EXCEPTION 
    WHEN undefined_table THEN NULL;
END $$;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ======================================
-- 2. CREATE DEPARTMENTS TABLE
-- ======================================

CREATE TABLE departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    manager_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================
-- 3. CREATE EMPLOYEES TABLE
-- ======================================

CREATE TABLE employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
    position VARCHAR(100),
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    salary DECIMAL(12,2),
    address TEXT,
    emergency_contact JSONB,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================
-- 4. CREATE USER PROFILES (SIMPLIFIED)
-- ======================================

CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================
-- 5. CREATE ATTENDANCE TABLE
-- ======================================

CREATE TABLE attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    check_in_time TIME,
    check_out_time TIME,
    break_duration INTEGER DEFAULT 0, -- in minutes
    total_hours DECIMAL(4,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Present' CHECK (status IN ('Present', 'Absent', 'Leave', 'Half Day', 'Late')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- ======================================
-- 6. CREATE LEAVES TABLE
-- ======================================

CREATE TABLE leaves (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
    leave_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================
-- 7. CREATE PAYROLL TABLE
-- ======================================

CREATE TABLE payroll (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    basic_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
    overtime_hours DECIMAL(4,2) DEFAULT 0,
    overtime_rate DECIMAL(8,2) DEFAULT 0,
    overtime_pay DECIMAL(12,2) DEFAULT 0,
    allowances DECIMAL(12,2) DEFAULT 0,
    deductions DECIMAL(12,2) DEFAULT 0,
    tax_deduction DECIMAL(12,2) DEFAULT 0,
    net_pay DECIMAL(12,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'paid')),
    processed_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ======================================
-- 8. CREATE TIMESHEETS TABLE
-- ======================================

CREATE TABLE timesheets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    break_duration INTEGER DEFAULT 0, -- in minutes
    total_hours DECIMAL(4,2) DEFAULT 0,
    description TEXT,
    project_name VARCHAR(200),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- ======================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- ======================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_employee_id ON user_profiles(employee_id);

-- Employees indexes
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_employee_number ON employees(employee_number);

-- Attendance indexes
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_status ON attendance(status);

-- Leaves indexes
CREATE INDEX idx_leaves_employee ON leaves(employee_id);
CREATE INDEX idx_leaves_status ON leaves(status);
CREATE INDEX idx_leaves_dates ON leaves(start_date, end_date);

-- Payroll indexes
CREATE INDEX idx_payroll_employee ON payroll(employee_id);
CREATE INDEX idx_payroll_period ON payroll(pay_period_start, pay_period_end);
CREATE INDEX idx_payroll_status ON payroll(status);

-- Timesheets indexes
CREATE INDEX idx_timesheets_employee_date ON timesheets(employee_id, date);
CREATE INDEX idx_timesheets_date ON timesheets(date);
CREATE INDEX idx_timesheets_status ON timesheets(status);

-- Departments indexes
CREATE INDEX idx_departments_name ON departments(name);

-- ======================================
-- 10. CREATE UPDATE TIMESTAMP FUNCTION
-- ======================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ======================================
-- 11. CREATE UPDATE TRIGGERS
-- ======================================

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leaves_updated_at BEFORE UPDATE ON leaves FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payroll_updated_at BEFORE UPDATE ON payroll FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_timesheets_updated_at BEFORE UPDATE ON timesheets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ======================================
-- 12. ENABLE ROW LEVEL SECURITY
-- ======================================

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaves ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;

-- ======================================
-- 13. CREATE SECURITY POLICIES (SIMPLE)
-- ======================================

-- Allow all authenticated users to access everything (since you're the owner)
CREATE POLICY "Allow all for authenticated users" ON departments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON employees FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON user_profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON attendance FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON leaves FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON payroll FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow all for authenticated users" ON timesheets FOR ALL USING (auth.role() = 'authenticated');

-- ======================================
-- 14. INSERT SAMPLE DATA
-- ======================================

-- Insert sample departments
INSERT INTO departments (name, description) VALUES 
('Human Resources', 'Employee relations and administration'),
('Information Technology', 'Technology and software development'),
('Finance', 'Financial management and accounting'),
('Operations', 'Day-to-day business operations'),
('Marketing', 'Marketing and customer relations'),
('Sales', 'Sales and business development');

-- ======================================
-- 15. CREATE YOUR OWNER PROFILE
-- ======================================

-- This will create your profile when you first sign in
-- The trigger will handle the rest
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ======================================
-- 16. SETUP COMPLETE MESSAGE
-- ======================================

SELECT 
  'KOCO Payroll Database Setup Complete!' as status,
  'Tables: ' || count(*) || ' created' as tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('departments', 'employees', 'user_profiles', 'attendance', 'leaves', 'payroll', 'timesheets');

-- Show created tables
SELECT 
  table_name as "Created Tables",
  'Ready for use' as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('departments', 'employees', 'user_profiles', 'attendance', 'leaves', 'payroll', 'timesheets')
ORDER BY table_name;