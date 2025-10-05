-- QUICK ADMIN ROLE VERIFICATION
-- Run this in Supabase SQL Editor to check current admin status

-- Check if user exists in auth.users
SELECT 'STEP 1: AUTH.USERS' as check_step;
SELECT 
    id,
    email,
    created_at,
    CASE WHEN id IS NOT NULL THEN '✅ EXISTS' ELSE '❌ NOT FOUND' END as status
FROM auth.users 
WHERE email = 'kegeorge5002@gmail.com';

-- Check user_profiles table
SELECT 'STEP 2: USER_PROFILES' as check_step;
SELECT 
    id,
    email,
    role,
    is_active,
    employee_id,
    CASE WHEN role = 'admin' THEN '✅ ADMIN ROLE' ELSE '❌ NOT ADMIN' END as role_status
FROM user_profiles 
WHERE email = 'kegeorge5002@gmail.com';

-- Force update to admin if needed
DO $$
DECLARE
    user_count INTEGER;
    admin_user_id UUID;
BEGIN
    -- Check if user exists in auth.users
    SELECT COUNT(*) INTO user_count
    FROM auth.users 
    WHERE email = 'kegeorge5002@gmail.com';
    
    IF user_count = 0 THEN
        RAISE NOTICE '❌ ERROR: User kegeorge5002@gmail.com not found in auth.users';
        RAISE NOTICE '📝 You need to sign up first at http://localhost:3000';
        RETURN;
    END IF;
    
    -- Get the user ID
    SELECT id INTO admin_user_id
    FROM auth.users 
    WHERE email = 'kegeorge5002@gmail.com'
    LIMIT 1;
    
    RAISE NOTICE '✅ User found in auth.users: %', admin_user_id;
    
    -- Force update user_profiles to admin
    INSERT INTO user_profiles (
        id, email, first_name, last_name, role, is_active
    ) VALUES (
        admin_user_id, 'kegeorge5002@gmail.com', 'Kevin', 'George', 'admin', true
    )
    ON CONFLICT (id) DO UPDATE SET
        role = 'admin',
        is_active = true,
        updated_at = NOW();
    
    RAISE NOTICE '🎉 FORCED user role to admin!';
END $$;

-- Final verification
SELECT 'FINAL CHECK' as verification;
SELECT 
    up.role,
    up.is_active,
    au.email,
    CASE 
        WHEN up.role = 'admin' AND up.is_active = true THEN '🎉 SUCCESS: User is admin!'
        ELSE '❌ FAILED: User is not admin'
    END as final_status
FROM auth.users au
LEFT JOIN user_profiles up ON au.id = up.id
WHERE au.email = 'kegeorge5002@gmail.com';