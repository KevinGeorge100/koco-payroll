-- KOCO Payroll Database Reset Script
-- Run this script FIRST if you need to start over completely

-- Drop existing triggers first
DROP TRIGGER IF EXISTS audit_employees ON employees;
DROP TRIGGER IF EXISTS audit_payroll_records ON payroll_records;
DROP TRIGGER IF EXISTS audit_timesheets ON timesheets;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
DROP TRIGGER IF EXISTS update_positions_updated_at ON positions;
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_timesheets_updated_at ON timesheets;
DROP TRIGGER IF EXISTS update_payroll_records_updated_at ON payroll_records;
DROP TRIGGER IF EXISTS update_tax_rates_updated_at ON tax_rates;
DROP TRIGGER IF EXISTS update_benefits_updated_at ON benefits;
DROP TRIGGER IF EXISTS update_employee_benefits_updated_at ON employee_benefits;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop functions
DROP FUNCTION IF EXISTS audit_trigger_function();
DROP FUNCTION IF EXISTS update_updated_at_column();
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS get_user_role(UUID);
DROP FUNCTION IF EXISTS get_employee_id_for_user(UUID);
DROP FUNCTION IF EXISTS generate_sample_timesheets(UUID, DATE, DATE);

-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS employee_benefits CASCADE;
DROP TABLE IF EXISTS benefits CASCADE;
DROP TABLE IF EXISTS tax_rates CASCADE;
DROP TABLE IF EXISTS payroll_records CASCADE;
DROP TABLE IF EXISTS timesheets CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS positions CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop custom types
DROP TYPE IF EXISTS payroll_status CASCADE;
DROP TYPE IF EXISTS timesheet_status CASCADE;
DROP TYPE IF EXISTS employee_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Success message
SELECT 'Database reset complete. You can now run schema.sql' AS message;