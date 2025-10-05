-- MANUAL ADMIN ROLE FIX
-- Copy and paste this entire file into Supabase SQL Editor
-- This will diagnose and manually fix admin role issues

-- ======================================
-- STEP 1: DIAGNOSTIC QUERIES
-- ======================================

-- Check if user exists in auth.users
SELECT 'CHECKING AUTH.USERS' as step;
SELECT 
    id as user_id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users 
WHERE email = 'kegeorge5002@gmail.com';

-- Check if user profile exists
SELECT 'CHECKING USER_PROFILES' as step;
SELECT 
    id,
    email,
    first_name,
    last_name,
    role,
    employee_id,
    department_id,
    is_active,
    created_at,
    updated_at
FROM user_profiles 
WHERE email = 'kegeorge5002@gmail.com';

-- Check if employee record exists
SELECT 'CHECKING EMPLOYEES' as step;
SELECT 
    id,
    employee_number,
    first_name,
    last_name,
    email,
    position,
    department_id,
    status
FROM employees 
WHERE email = 'kegeorge5002@gmail.com';

-- ======================================
-- STEP 2: MANUAL ADMIN ROLE ASSIGNMENT
-- ======================================

DO $$
DECLARE
    admin_user_id UUID;
    admin_employee_id UUID;
    it_dept_id UUID;
    profile_exists BOOLEAN := false;
    employee_exists BOOLEAN := false;
BEGIN
    RAISE NOTICE '🔧 Starting manual admin role assignment...';
    
    -- Get user ID from auth.users
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'kegeorge5002@gmail.com';
    
    IF admin_user_id IS NULL THEN
        RAISE NOTICE '❌ ERROR: User kegeorge5002@gmail.com not found in auth.users';
        RAISE NOTICE '📝 Please sign up first at http://localhost:3000';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Found user in auth.users: %', admin_user_id;
    
    -- Get IT department ID
    SELECT id INTO it_dept_id FROM departments WHERE name = 'IT' LIMIT 1;
    IF it_dept_id IS NULL THEN
        RAISE NOTICE '⚠️  IT department not found, will use NULL';
    ELSE
        RAISE NOTICE '✅ IT department ID: %', it_dept_id;
    END IF;
    
    -- Check if employee record exists
    SELECT EXISTS(SELECT 1 FROM employees WHERE email = 'kegeorge5002@gmail.com') INTO employee_exists;
    
    IF NOT employee_exists THEN
        -- Create employee record
        INSERT INTO employees (
            employee_number, 
            first_name, 
            last_name, 
            email, 
            position, 
            department_id, 
            salary, 
            hire_date,
            status
        ) VALUES (
            'ADMIN001',
            'Kevin',
            'George', 
            'kegeorge5002@gmail.com',
            'System Administrator',
            it_dept_id,
            100000,
            CURRENT_DATE,
            'active'
        ) RETURNING id INTO admin_employee_id;
        
        RAISE NOTICE '✅ Created new employee record: %', admin_employee_id;
    ELSE
        -- Get existing employee ID
        SELECT id INTO admin_employee_id FROM employees WHERE email = 'kegeorge5002@gmail.com';
        RAISE NOTICE '✅ Found existing employee record: %', admin_employee_id;
    END IF;
    
    -- Check if user profile exists
    SELECT EXISTS(SELECT 1 FROM user_profiles WHERE id = admin_user_id) INTO profile_exists;
    
    IF NOT profile_exists THEN
        -- Create user profile
        INSERT INTO user_profiles (
            id,
            email,
            first_name,
            last_name,
            role,
            employee_id,
            department_id,
            is_active
        ) VALUES (
            admin_user_id,
            'kegeorge5002@gmail.com',
            'Kevin',
            'George',
            'admin',
            admin_employee_id,
            it_dept_id,
            true
        );
        RAISE NOTICE '✅ Created new user profile with admin role';
    ELSE
        -- Update existing user profile to admin
        UPDATE user_profiles 
        SET 
            role = 'admin',
            employee_id = admin_employee_id,
            department_id = it_dept_id,
            is_active = true,
            updated_at = NOW()
        WHERE id = admin_user_id;
        RAISE NOTICE '✅ Updated existing user profile to admin role';
    END IF;
    
    RAISE NOTICE '🎉 MANUAL ADMIN ASSIGNMENT COMPLETED!';
    RAISE NOTICE '👤 User ID: %', admin_user_id;
    RAISE NOTICE '💼 Employee ID: %', admin_employee_id;
    RAISE NOTICE '🔐 Role: admin';
    RAISE NOTICE '📝 Next: Log out and log back in to see admin features';
    
END $$;

-- ======================================
-- STEP 3: VERIFICATION
-- ======================================

-- Final verification query
SELECT 'FINAL VERIFICATION' as step;
SELECT 
    'SUCCESS: User is now admin' as status,
    up.id as user_id,
    up.email,
    up.role,
    up.employee_id,
    e.employee_number,
    e.position
FROM user_profiles up
LEFT JOIN employees e ON up.employee_id = e.id
WHERE up.email = 'kegeorge5002@gmail.com' AND up.role = 'admin';

-- Check admin permissions
SELECT 'ADMIN PERMISSIONS CHECK' as step;
SELECT 
    'Admin has access to: ' || resource || ' (' || action || ')' as permissions
FROM role_permissions 
WHERE role = 'admin'
ORDER BY resource, action
LIMIT 10;

-- Success message
SELECT '🎉 Manual admin role assignment completed!' as status,
       'Log out and log back in to see admin features.' as message;