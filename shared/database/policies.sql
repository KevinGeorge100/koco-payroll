-- Define user_role enum if it does not exist
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'hr', 'employee');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_benefits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
DECLARE
    user_role_val user_role;
BEGIN
    SELECT role INTO user_role_val FROM user_profiles WHERE id = user_id;
    RETURN COALESCE(user_role_val, 'employee');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get employee ID for a user
CREATE OR REPLACE FUNCTION get_employee_id_for_user(input_user_id UUID)
RETURNS UUID AS $$
DECLARE
    emp_id UUID;
BEGIN
    SELECT id INTO emp_id FROM employees WHERE user_id = input_user_id;
    RETURN emp_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------
-- User Profiles Policies
-- ---------------------------------
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins and HR can view all profiles" ON user_profiles
    FOR SELECT USING (get_user_role(auth.uid()) IN ('admin', 'hr'));

CREATE POLICY "Admins can manage all profiles" ON user_profiles
    FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- ---------------------------------
-- Departments Policies
-- ---------------------------------
CREATE POLICY "All authenticated users can view departments" ON departments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and HR can manage departments" ON departments
    FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'hr'));

-- ---------------------------------
-- Positions Policies
-- ---------------------------------
CREATE POLICY "All authenticated users can view positions" ON positions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and HR can manage positions" ON positions
    FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'hr'));

-- ---------------------------------
-- Employees Policies
-- ---------------------------------
CREATE POLICY "Employees can view own record" ON employees
    FOR SELECT USING (user_id = auth.uid());

-- Fixed: Removed OLD/NEW references - employees can only update their own record
CREATE POLICY "Employees can update own record" ON employees
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Admins and HR can view all employees" ON employees
    FOR SELECT USING (get_user_role(auth.uid()) IN ('admin', 'hr'));

CREATE POLICY "Admins and HR can manage employees" ON employees
    FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'hr'));

-- ---------------------------------
-- Projects Policies
-- ---------------------------------
CREATE POLICY "All authenticated users can view active projects" ON projects
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

CREATE POLICY "Admins and HR can manage projects" ON projects
    FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'hr'));

-- ---------------------------------
-- Timesheets Policies
-- ---------------------------------
CREATE POLICY "Employees can view own timesheets" ON timesheets
    FOR SELECT USING (employee_id = get_employee_id_for_user(auth.uid()));

-- Fixed: Simplified timesheet management policies
CREATE POLICY "Employees can insert own timesheets" ON timesheets
    FOR INSERT WITH CHECK (employee_id = get_employee_id_for_user(auth.uid()));

CREATE POLICY "Employees can update own draft timesheets" ON timesheets
    FOR UPDATE USING (
        employee_id = get_employee_id_for_user(auth.uid()) AND 
        status = 'draft'
    );

CREATE POLICY "Employees can delete own draft timesheets" ON timesheets
    FOR DELETE USING (
        employee_id = get_employee_id_for_user(auth.uid()) AND 
        status = 'draft'
    );

CREATE POLICY "Admins and HR can view all timesheets" ON timesheets
    FOR SELECT USING (get_user_role(auth.uid()) IN ('admin', 'hr'));

CREATE POLICY "Admins and HR can manage timesheets" ON timesheets
    FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'hr'));

-- ---------------------------------
-- Payroll Records Policies
-- ---------------------------------
CREATE POLICY "Employees can view own payroll records" ON payroll_records
    FOR SELECT USING (employee_id = get_employee_id_for_user(auth.uid()));

CREATE POLICY "Admins and HR can view all payroll records" ON payroll_records
    FOR SELECT USING (get_user_role(auth.uid()) IN ('admin', 'hr'));

CREATE POLICY "Admins and HR can manage payroll records" ON payroll_records
    FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'hr'));

-- ---------------------------------
-- Tax Rates Policies
-- ---------------------------------
CREATE POLICY "All authenticated users can view tax rates" ON tax_rates
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage tax rates" ON tax_rates
    FOR ALL USING (get_user_role(auth.uid()) = 'admin');

-- ---------------------------------
-- Benefits Policies
-- ---------------------------------
CREATE POLICY "All authenticated users can view benefits" ON benefits
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins and HR can manage benefits" ON benefits
    FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'hr'));

-- ---------------------------------
-- Employee Benefits Policies
-- ---------------------------------
CREATE POLICY "Employees can view own benefits" ON employee_benefits
    FOR SELECT USING (employee_id = get_employee_id_for_user(auth.uid()));

CREATE POLICY "Admins and HR can view all employee benefits" ON employee_benefits
    FOR SELECT USING (get_user_role(auth.uid()) IN ('admin', 'hr'));

CREATE POLICY "Admins and HR can manage employee benefits" ON employee_benefits
    FOR ALL USING (get_user_role(auth.uid()) IN ('admin', 'hr'));

-- ---------------------------------
-- Audit Logs Policies (read-only for admins)
-- ---------------------------------
CREATE POLICY "Only admins can view audit logs" ON audit_logs
    FOR SELECT USING (get_user_role(auth.uid()) = 'admin');

-- ---------------------------------
-- User Registration Trigger
-- ---------------------------------
-- Create function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, role)
    VALUES (NEW.id, 'employee');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
-- This assumes 'auth.users' is the table used by your authentication service (e.g., Supabase, Auth0)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();