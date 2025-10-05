-- First, let's see what the current user_profiles table looks like
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- If the table doesn't exist or has wrong structure, let's drop and recreate it
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create the correct user_profiles table
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE,
    first_name TEXT,
    last_name TEXT,
    role TEXT DEFAULT 'employee',
    employee_id UUID,
    department_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create a simple policy for now
CREATE POLICY "Enable all access for authenticated users" ON user_profiles
    FOR ALL USING (auth.role() = 'authenticated');

-- Now insert your admin user
-- First, get your user ID from auth.users
SELECT id, email FROM auth.users WHERE email = 'kegeorge5002@gmail.com';

-- Then insert your profile with admin role (replace YOUR_USER_ID with the actual ID from above)
-- INSERT INTO user_profiles (id, email, first_name, last_name, role, is_active) 
-- VALUES ('YOUR_USER_ID_HERE', 'kegeorge5002@gmail.com', 'Admin', 'User', 'admin', true);

-- Check if it worked
SELECT * FROM user_profiles WHERE email = 'kegeorge5002@gmail.com';