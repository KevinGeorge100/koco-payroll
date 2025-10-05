-- DELETE/RESET USER ACCOUNT
-- Copy and paste this entire file into Supabase SQL Editor
-- This safely removes a user account and all associated data

-- ======================================
-- USER DELETION SCRIPT
-- ======================================

-- CHANGE THIS EMAIL TO THE USER YOU WANT TO DELETE
-- Replace 'kegeorge5002@gmail.com' with the email you want to delete
DO $$
DECLARE
    target_email TEXT := 'kegeorge5002@gmail.com';  -- CHANGE THIS EMAIL
    user_id_to_delete UUID;
    employee_id_to_delete UUID;
    deleted_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🗑️  Starting deletion process for: %', target_email;
    
    -- Get user ID from auth.users
    SELECT id INTO user_id_to_delete 
    FROM auth.users 
    WHERE email = target_email;
    
    -- Get employee ID from user_profiles
    SELECT employee_id INTO employee_id_to_delete 
    FROM user_profiles 
    WHERE email = target_email;
    
    IF user_id_to_delete IS NULL THEN
        RAISE NOTICE '❌ User % not found in database', target_email;
        RETURN;
    END IF;
    
    RAISE NOTICE '👤 Found user ID: %', user_id_to_delete;
    IF employee_id_to_delete IS NOT NULL THEN
        RAISE NOTICE '💼 Found employee ID: %', employee_id_to_delete;
    END IF;
    
    -- Delete associated data in order (due to foreign key constraints)
    
    -- 1. Delete leave requests
    DELETE FROM leave_requests WHERE employee_id = employee_id_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '✅ Deleted % leave requests', deleted_count;
    END IF;
    
    -- 2. Delete attendance records
    DELETE FROM attendance WHERE employee_id = employee_id_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '✅ Deleted % attendance records', deleted_count;
    END IF;
    
    -- 3. Delete payroll records
    DELETE FROM payroll WHERE employee_id = employee_id_to_delete OR processed_by = employee_id_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '✅ Deleted % payroll records', deleted_count;
    END IF;
    
    -- 4. Update departments that have this employee as manager
    UPDATE departments SET manager_id = NULL WHERE manager_id = employee_id_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '✅ Removed manager role from % departments', deleted_count;
    END IF;
    
    -- 5. Delete user profile
    DELETE FROM user_profiles WHERE id = user_id_to_delete;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    IF deleted_count > 0 THEN
        RAISE NOTICE '✅ Deleted user profile';
    END IF;
    
    -- 6. Delete employee record
    IF employee_id_to_delete IS NOT NULL THEN
        DELETE FROM employees WHERE id = employee_id_to_delete;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        IF deleted_count > 0 THEN
            RAISE NOTICE '✅ Deleted employee record';
        END IF;
    END IF;
    
    -- Note: We cannot delete from auth.users directly via SQL
    -- The auth.users table is managed by Supabase Auth
    RAISE NOTICE '⚠️  Note: User still exists in auth.users (managed by Supabase Auth)';
    RAISE NOTICE '📝 To completely remove: Go to Supabase Dashboard > Authentication > Users';
    RAISE NOTICE '🎉 Account cleanup completed for: %', target_email;
    
END $$;

-- ======================================
-- VERIFICATION QUERIES
-- ======================================

-- Check if user still exists anywhere
SELECT 'Checking remaining data for user...' as status;

-- Check auth.users (will still exist)
SELECT 
    'auth.users' as table_name,
    COUNT(*) as count
FROM auth.users 
WHERE email = 'kegeorge5002@gmail.com';  -- CHANGE THIS EMAIL

-- Check user_profiles (should be 0)
SELECT 
    'user_profiles' as table_name,
    COUNT(*) as count
FROM user_profiles 
WHERE email = 'kegeorge5002@gmail.com';  -- CHANGE THIS EMAIL

-- Check employees (should be 0)
SELECT 
    'employees' as table_name,
    COUNT(*) as count
FROM employees 
WHERE email = 'kegeorge5002@gmail.com';  -- CHANGE THIS EMAIL

-- ======================================
-- ALTERNATIVE: RESET USER TO EMPLOYEE ROLE
-- ======================================

-- Uncomment this section if you want to reset user to employee role instead of deleting
/*
DO $$
DECLARE
    target_email TEXT := 'kegeorge5002@gmail.com';  -- CHANGE THIS EMAIL
BEGIN
    UPDATE user_profiles 
    SET role = 'employee', 
        updated_at = NOW()
    WHERE email = target_email;
    
    RAISE NOTICE '🔄 Reset % to employee role', target_email;
END $$;
*/

-- Success message
SELECT 'User deletion/cleanup completed! 🗑️' as status,
       'Check verification queries above for confirmation.' as message;