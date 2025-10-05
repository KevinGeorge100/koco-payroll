-- Admin User Setup Script
-- Run this in your Supabase SQL Editor or database console

-- First, let's check if we have any existing admin users
SELECT email, role FROM user_profiles WHERE role = 'admin';

-- Create an admin user (replace with your actual admin email)
-- Note: You'll need to sign up with this email first through your app's signup form
-- Then run this script to upgrade the user to admin role

-- Example: Update a user to admin role (replace 'kegeorge5002@gmail.com' with actual email)
UPDATE user_profiles 
SET role = 'admin' 
WHERE email = 'kegeorge5002@gmail.com';

-- If the user doesn't exist in user_profiles yet, you can insert manually
-- (Only do this AFTER the user has signed up through Supabase Auth)
/*
INSERT INTO user_profiles (
  user_id, 
  email, 
  first_name, 
  last_name, 
  role, 
  is_active
) VALUES (
  'USER_ID_FROM_AUTH_USERS_TABLE',  -- Get this from auth.users table
  'kegeorge5002@gmail.com',
  'Admin',
  'User',
  'admin',
  true
);
*/

-- Verify the admin user was created
SELECT email, role, is_active FROM user_profiles WHERE role = 'admin';