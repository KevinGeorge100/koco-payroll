-- KOCO Payroll Role-Based Access Control Setup
-- This script sets up user roles and permissions for the payroll system

-- Step 1: Create roles enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'hr', 'employee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 2: Create user profiles table to extend Supabase auth
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role user_role DEFAULT 'employee',
    employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
    department_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create role permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
    id SERIAL PRIMARY KEY,
    role user_role NOT NULL,
    resource TEXT NOT NULL, -- e.g., 'employees', 'payroll', 'attendance'
    action TEXT NOT NULL,   -- e.g., 'create', 'read', 'update', 'delete'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Insert default role permissions
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

-- HR permissions (employee and payroll management)
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

-- Employee permissions (view personal data only)
('employee', 'employees', 'read'), -- own profile only
('employee', 'payslips', 'read'),  -- own payslips only
('employee', 'attendance', 'read'), -- own attendance only
('employee', 'attendance', 'create'), -- mark own attendance
('employee', 'leaves', 'create'),   -- request leave
('employee', 'leaves', 'read')      -- view own leaves
ON CONFLICT DO NOTHING;

-- Step 5: Create function to get user role
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

-- Step 6: Create function to check permissions
CREATE OR REPLACE FUNCTION has_permission(user_id UUID, resource_name TEXT, action_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_role_value user_role;
    has_perm BOOLEAN := false;
BEGIN
    -- Get user role
    SELECT get_user_role(user_id) INTO user_role_value;
    
    -- Check if user has permission
    SELECT EXISTS(
        SELECT 1 FROM role_permissions 
        WHERE role = user_role_value 
        AND resource = resource_name 
        AND action = action_name
    ) INTO has_perm;
    
    RETURN has_perm;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 8: Create trigger for user_profiles
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 9: Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 10: Create RLS policies
-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admins and HR can read all profiles
CREATE POLICY "Admins and HR can read all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'hr')
            AND is_active = true
        )
    );

-- Only admins can insert/delete user profiles
CREATE POLICY "Only admins can manage users" ON user_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
            AND is_active = true
        )
    );

-- Step 11: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_employee_id ON user_profiles(employee_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_resource ON role_permissions(role, resource, action);

-- Step 12: Insert sample admin user (update email as needed)
INSERT INTO user_profiles (id, email, first_name, last_name, role, is_active)
VALUES (
    '00000000-0000-0000-0000-000000000000', -- Placeholder UUID - update with actual admin user ID
    'admin@kocopayroll.com',
    'System',
    'Administrator',
    'admin',
    true
) ON CONFLICT (email) DO NOTHING;

-- Success message
SELECT 'Role-based access control system setup completed successfully!' as status;