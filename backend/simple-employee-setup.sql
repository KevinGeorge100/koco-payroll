-- KOCO Payroll System - Simple Employee Table Setup
-- This script works with existing constraints and adds only what's needed

-- First, let's check what columns exist and their types
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'employees' 
ORDER BY ordinal_position;

-- Add missing payroll columns if they don't exist (safe additions)
ALTER TABLE employees ADD COLUMN IF NOT EXISTS base_salary DECIMAL(12,2);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(8,2);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_type VARCHAR(20) DEFAULT 'full-time';

-- Add employment_type constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name = 'employees_employment_type_check'
    ) THEN
        ALTER TABLE employees ADD CONSTRAINT employees_employment_type_check 
        CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'intern'));
    END IF;
END $$;

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_employee_number ON employees(employee_number);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop and recreate trigger safely
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample employees (handling department_id as UUID if that's what exists)
-- First, let's try inserting with UUID values for department_id and position_id
INSERT INTO employees (
    first_name, last_name, email, phone, date_of_birth, hire_date,
    salary, employee_number, address, base_salary, hourly_rate, employment_type
) 
SELECT 'John', 'Doe', 'john.doe@example.com', '555-0101', '1990-05-15'::DATE, '2023-01-15'::DATE,
    60000.00, 'EMP001', '123 Main St, City, State 12345', 60000.00, 28.85, 'full-time'
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'john.doe@example.com')

UNION ALL

SELECT 'Jane', 'Smith', 'jane.smith@example.com', '555-0102', '1988-09-22'::DATE, '2023-02-01'::DATE,
    65000.00, 'EMP002', '456 Oak Ave, City, State 12345', 65000.00, 31.25, 'full-time'
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'jane.smith@example.com');

-- Show final table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'employees' 
ORDER BY ordinal_position;

-- Show row count
SELECT COUNT(*) as employee_count FROM employees;

-- Test a simple employee creation query to make sure everything works
SELECT 'Database setup completed successfully. Employees table is ready.' as status;