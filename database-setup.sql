-- ===================================
-- KOCO Payroll Database Setup Script
-- Run this in Supabase SQL Editor
-- ===================================

-- Step 1: Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 2: Create custom types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'hr', 'employee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE employee_status AS ENUM ('active', 'inactive', 'terminated');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Step 3: Create the essential table for authentication
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role user_role DEFAULT 'employee',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policies (with error handling)
DO $$ BEGIN
    CREATE POLICY "Users can view own profile" 
    ON user_profiles FOR SELECT 
    USING (auth.uid() = id);
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Policy "Users can view own profile" already exists, skipping...';
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own profile" 
    ON user_profiles FOR UPDATE 
    USING (auth.uid() = id);
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Policy "Users can update own profile" already exists, skipping...';
END $$;

-- Step 6: Create a function to automatically create user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'role', 'employee')::user_role);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create trigger to automatically create profiles (with error handling)
DO $$ BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    RAISE NOTICE 'Trigger created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Trigger creation failed or already exists: %', SQLERRM;
END $$;

-- Success message
SELECT 'Database setup completed successfully!' as status;