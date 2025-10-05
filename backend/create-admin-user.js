// Admin User Creation Script
// Run this after starting your backend server: node create-admin-user.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.log('Make sure you have SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user...');
    
    // Admin user details - CHANGE THESE TO YOUR DESIRED ADMIN CREDENTIALS
    const adminEmail = 'kegeorge5002@gmail.com';
    const adminPassword = 'AdminPassword123!'; // Change this to a secure password
    const adminFirstName = 'System';
    const adminLastName = 'Administrator';

    console.log(`📧 Creating admin user with email: ${adminEmail}`);

    // Step 1: Create the user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: adminFirstName,
        last_name: adminLastName,
        role: 'admin'
      }
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError);
      return;
    }

    console.log('✅ Auth user created successfully');
    console.log('User ID:', authUser.user.id);

    // Step 2: Create the user profile with admin role
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: authUser.user.id,
        email: adminEmail,
        first_name: adminFirstName,
        last_name: adminLastName,
        role: 'admin',
        is_active: true
      })
      .select()
      .single();

    if (profileError) {
      console.error('❌ Error creating user profile:', profileError);
      return;
    }

    console.log('✅ Admin user profile created successfully');
    console.log('Profile:', profile);

    console.log('\n🎉 Admin user setup complete!');
    console.log('📋 Login credentials:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   Role: admin`);
    console.log('\n🔐 You can now sign in to your app with these credentials');
    console.log('⚠️  IMPORTANT: Change the password after first login!');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Alternative function to upgrade an existing user to admin
async function upgradeUserToAdmin(email) {
  try {
    console.log(`🔧 Upgrading user ${email} to admin...`);

    // First, find the user ID from auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      console.error('❌ Error fetching users from auth:', authError);
      return;
    }

    const user = authUsers.users.find(u => u.email === email);
    if (!user) {
      console.log(`❌ User with email ${email} not found in authentication`);
      console.log('Make sure the user has signed up first');
      return;
    }

    console.log(`📧 Found user: ${user.email} (ID: ${user.id})`);

    // Check if user profile exists, create if not
    const { data: existingProfile, error: profileCheckError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileCheckError && profileCheckError.code !== 'PGRST116') {
      console.error('❌ Error checking user profile:', profileCheckError);
      return;
    }

    if (!existingProfile) {
      // Create user profile if it doesn't exist
      console.log('📝 Creating user profile...');
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,  // Use user_id instead of id
          first_name: user.user_metadata?.first_name || 'User',
          last_name: user.user_metadata?.last_name || 'Admin',
          role: 'admin',
          is_active: true
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating user profile:', createError);
        return;
      }

      console.log('✅ User profile created and upgraded to admin successfully');
      console.log('Profile:', newProfile);
    } else {
      // Update existing profile to admin
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ role: 'admin' })
        .eq('user_id', user.id)
        .select();

      if (error) {
        console.error('❌ Error upgrading user to admin:', error);
        return;
      }

      console.log('✅ User upgraded to admin successfully');
      console.log('Updated profile:', data[0]);
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Check command line arguments
const command = process.argv[2];
const email = process.argv[3];

if (command === 'create') {
  createAdminUser();
} else if (command === 'upgrade' && email) {
  upgradeUserToAdmin(email);
} else {
  console.log('📖 Usage:');
  console.log('  Create new admin user:    node create-admin-user.js create');
  console.log('  Upgrade existing user:    node create-admin-user.js upgrade user@example.com');
}