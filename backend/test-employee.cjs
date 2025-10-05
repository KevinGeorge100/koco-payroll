require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testEmployeeCreation() {
    try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        
        console.log('Testing employee creation...');
        
        // Try to create a minimal employee record
        const newEmployee = {
            first_name: 'Test',
            last_name: 'Employee',
            email: 'test@example.com',
            phone: '555-0123',
            date_of_birth: '1990-01-01',
            hire_date: '2024-01-01',
            salary: 50000,
            employee_number: 'TEST001',
            address: '123 Test St'
        };
        
        console.log('Attempting to insert employee:', newEmployee);
        
        const { data, error } = await supabase
            .from('employees')
            .insert([newEmployee])
            .select();
        
        if (error) {
            console.error('Insert error:', error);
            console.error('Error details:', error.details);
            console.error('Error hint:', error.hint);
        } else {
            console.log('Success! Inserted employee:', data);
        }
        
    } catch (error) {
        console.error('Script error:', error);
    }
}

testEmployeeCreation();