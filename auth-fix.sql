-- ===================================
-- KOCO Payroll Authentication Fix
-- Run this if you already have tables but authentication is failing
-- ===================================

-- Ensure user_profiles table exists
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    role user_role DEFAULT 'employee',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (with error handling)
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

DO $$ BEGIN
    CREATE POLICY "Users can insert own profile" 
    ON user_profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Policy "Users can insert own profile" already exists, skipping...';
END $$;

-- Create function to automatically create user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, role)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'role', 'employee')::user_role)
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profiles
DO $$ BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    RAISE NOTICE 'Authentication trigger created successfully';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Authentication trigger creation failed: %', SQLERRM;
END $$;

-- Success message
SELECT 'Authentication setup completed successfully!' as status;