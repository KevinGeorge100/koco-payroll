-- ADMIN USER SETUP
-- Run this AFTER the main database setup
-- This creates your admin account

-- ADMIN USER SETUP
-- Run this AFTER the main database setup
-- This creates your admin account

-- ======================================
-- AUTOMATED ADMIN USER CREATION
-- ======================================

DO $$
DECLARE
    admin_user_id UUID;
    admin_employee_id UUID;
    it_dept_id UUID;
BEGIN
    -- Get IT department ID (for admin user)
    SELECT id INTO it_dept_id FROM departments WHERE name = 'IT' LIMIT 1;
    
    -- Check if user already exists in auth.users
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'kegeorge5002@gmail.com';
    
    -- If user doesn't exist in auth.users, show instructions
    IF admin_user_id IS NULL THEN
        RAISE NOTICE '⚠️  User kegeorge5002@gmail.com does not exist in auth.users yet.';
        RAISE NOTICE '📝 INSTRUCTIONS:';
        RAISE NOTICE '1. Go to your app at http://localhost:3000';
        RAISE NOTICE '2. Click "Sign Up" and create account with kegeorge5002@gmail.com';
        RAISE NOTICE '3. Complete email verification if required';
        RAISE NOTICE '4. Come back and run this script again';
        RETURN;
    END IF;
    
    RAISE NOTICE '✅ Found user in auth.users: %', admin_user_id;
    
    -- Create employee record for admin user if it doesn't exist
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
    ) 
    ON CONFLICT (email) DO UPDATE SET
        position = EXCLUDED.position,
        department_id = EXCLUDED.department_id,
        status = 'active'
    RETURNING id INTO admin_employee_id;
    
    -- Get employee ID if it was already created
    IF admin_employee_id IS NULL THEN
        SELECT id INTO admin_employee_id FROM employees WHERE email = 'kegeorge5002@gmail.com';
    END IF;
    
    RAISE NOTICE '✅ Employee record created/updated: %', admin_employee_id;
    
    -- Create or update user profile with admin role
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
    )
    ON CONFLICT (id) DO UPDATE SET
        role = 'admin',
        employee_id = EXCLUDED.employee_id,
        department_id = EXCLUDED.department_id,
        is_active = true,
        updated_at = NOW();
    
    RAISE NOTICE '🎉 Admin user setup completed successfully!';
    RAISE NOTICE '👤 User ID: %', admin_user_id;
    RAISE NOTICE '💼 Employee ID: %', admin_employee_id;
    RAISE NOTICE '📧 Email: kegeorge5002@gmail.com';
    RAISE NOTICE '🔐 Role: admin';
    
END $$;

-- Step 3: Verify admin account was created
SELECT 
    up.id,
    up.email,
    up.first_name,
    up.last_name,
    up.role,
    up.is_active,
    au.email as auth_email
FROM user_profiles up
LEFT JOIN auth.users au ON up.id = au.id
WHERE up.email = 'kegeorge5002@gmail.com';

-- Step 4: Grant admin access to all resources (if needed)
SELECT 
    'Admin has access to: ' || resource || ' (' || action || ')' as permissions
FROM role_permissions 
WHERE role = 'admin'
ORDER BY resource, action;

-- Success message
SELECT 'Admin user setup completed! 🔐' as status,
       'You can now login with kegeorge5002@gmail.com as admin' as message;