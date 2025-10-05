-- KOCO Payroll System - Ultra-Safe Employee Table Setup
-- This script ONLY adds what's missing and never modifies existing constrained columns

-- Step 1: Check current table structure (informational only)
SELECT 'Checking current employees table structure...' as info;

-- Step 2: Add ONLY the missing payroll columns (safe operations)
-- These columns don't exist yet, so no constraints to worry about
ALTER TABLE employees ADD COLUMN IF NOT EXISTS base_salary DECIMAL(12,2);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(8,2);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_type VARCHAR(20) DEFAULT 'full-time';

-- Step 3: Add employment_type constraint safely
DO $$
BEGIN
    -- Only add constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'employees_employment_type_check' 
        AND table_name = 'employees'
    ) THEN
        ALTER TABLE employees ADD CONSTRAINT employees_employment_type_check 
        CHECK (employment_type IN ('full-time', 'part-time', 'contract', 'intern'));
    END IF;
END $$;

-- Step 4: Create indexes safely (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_employee_number ON employees(employee_number);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

-- Step 5: Create/update trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 6: Recreate trigger safely
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 7: Try to insert sample data without department_id/position_id to avoid constraint issues
INSERT INTO employees (
    first_name, last_name, email, phone, date_of_birth, hire_date,
    salary, employee_number, address, base_salary, hourly_rate, employment_type
) 
SELECT 'John', 'Doe', 'john.doe@example.com', '555-0101', 
       '1990-05-15'::DATE, '2023-01-15'::DATE,
       60000.00, 'EMP001', '123 Main St, City, State 12345', 
       60000.00, 28.85, 'full-time'
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'john.doe@example.com');

INSERT INTO employees (
    first_name, last_name, email, phone, date_of_birth, hire_date,
    salary, employee_number, address, base_salary, hourly_rate, employment_type
) 
SELECT 'Jane', 'Smith', 'jane.smith@example.com', '555-0102', 
       '1988-09-22'::DATE, '2023-02-01'::DATE,
       65000.00, 'EMP002', '456 Oak Ave, City, State 12345', 
       65000.00, 31.25, 'full-time'
WHERE NOT EXISTS (SELECT 1 FROM employees WHERE email = 'jane.smith@example.com');

-- Step 8: Verification
SELECT 'SUCCESS: Employee table setup completed!' as status;
SELECT COUNT(*) as total_employees FROM employees;

-- Step 9: Show final table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'employees' 
ORDER BY ordinal_position;