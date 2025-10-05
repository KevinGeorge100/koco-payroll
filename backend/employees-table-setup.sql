-- Create employees table for KOCO Payroll System
-- This script creates the employees table with all necessary fields for payroll processing

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    hire_date DATE,
    department_id VARCHAR(50),
    position_id VARCHAR(50),
    salary DECIMAL(12,2),
    employee_number VARCHAR(50) UNIQUE,
    address TEXT,
    emergency_contact JSONB,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional payroll-related fields
    base_salary DECIMAL(12,2),
    hourly_rate DECIMAL(8,2),
    employment_type VARCHAR(20) DEFAULT 'full-time' CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'intern'))
);

-- Update existing columns to correct types if they exist but are wrong type
DO $$
BEGIN
    -- Change department_id to VARCHAR if it's currently UUID
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'department_id' AND data_type = 'uuid'
    ) THEN
        ALTER TABLE employees ALTER COLUMN department_id TYPE VARCHAR(50) USING department_id::TEXT;
    END IF;
    
    -- Change position_id to VARCHAR if it's currently UUID
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'employees' AND column_name = 'position_id' AND data_type = 'uuid'
    ) THEN
        ALTER TABLE employees ALTER COLUMN position_id TYPE VARCHAR(50) USING position_id::TEXT;
    END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_employee_number ON employees(employee_number);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);

-- Create updated_at trigger function (replace if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists, then create new one
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add missing payroll columns if they don't exist
ALTER TABLE employees ADD COLUMN IF NOT EXISTS base_salary DECIMAL(12,2);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(8,2);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_type VARCHAR(20) DEFAULT 'full-time';

-- Add constraint for employment_type if it doesn't exist
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

-- Insert sample data with just the basic required fields first
INSERT INTO employees (
    first_name, last_name, email, phone, date_of_birth, hire_date,
    department_id, position_id, salary, employee_number, address
) 
SELECT 'John', 'Doe', 'john.doe@example.com', '555-0101', '1990-05-15'::DATE, '2023-01-15'::DATE,
    '1', '1', 60000.00, 'EMP001', '123 Main St, City, State 12345'
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'john.doe@example.com')

UNION ALL

SELECT 'Jane', 'Smith', 'jane.smith@example.com', '555-0102', '1988-09-22'::DATE, '2023-02-01'::DATE,
    '2', '3', 65000.00, 'EMP002', '456 Oak Ave, City, State 12345'
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'jane.smith@example.com');

-- Update the payroll fields for the sample employees
UPDATE employees 
SET base_salary = salary, 
    hourly_rate = ROUND(salary / 2080, 2), 
    employment_type = 'full-time'
WHERE email IN ('john.doe@example.com', 'jane.smith@example.com') 
AND base_salary IS NULL;

-- Verify table was created successfully
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'employees') THEN
        RAISE NOTICE 'SUCCESS: employees table exists';
    ELSE
        RAISE NOTICE 'ERROR: employees table was not created';
    END IF;
END $$;

-- Display table structure for verification
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