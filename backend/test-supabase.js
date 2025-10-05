import { supabase } from './src/config/supabase.js';
import dotenv from 'dotenv';

dotenv.config();

async function testSupabaseConnection() {
  console.log('Testing Supabase connection...');
  console.log('URL:', process.env.SUPABASE_URL);
  console.log('Service Key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('employees')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Supabase connection failed:', error);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    console.log('Employee count:', data);
    return true;
  } catch (err) {
    console.error('❌ Connection error:', err.message);
    return false;
  }
}

async function testEmployeeCreation() {
  console.log('\n🧪 Testing employee creation...');
  
  const testEmployee = {
    employee_number: 'TEST001',
    first_name: 'Test',
    last_name: 'Employee',
    email: 'test@example.com',
    position: 'Software Developer',
    salary: 50000,
    status: 'active'
  };
  
  try {
    const { data, error } = await supabase
      .from('employees')
      .insert(testEmployee)
      .select()
      .single();
    
    if (error) {
      console.error('❌ Employee creation failed:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return false;
    }
    
    console.log('✅ Employee created successfully:', data);
    
    // Clean up test data
    await supabase.from('employees').delete().eq('id', data.id);
    console.log('🧹 Test data cleaned up');
    
    return true;
  } catch (err) {
    console.error('❌ Employee creation error:', err.message);
    return false;
  }
}

async function runTests() {
  const connectionOk = await testSupabaseConnection();
  if (connectionOk) {
    await testEmployeeCreation();
  }
}

runTests();