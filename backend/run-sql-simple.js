require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function runSQL() {
    try {
        console.log('Supabase URL:', process.env.SUPABASE_URL ? 'Found' : 'Missing');
        console.log('Supabase Key:', process.env.SUPABASE_ANON_KEY ? 'Found' : 'Missing');
        
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        
        console.log('Executing payroll column additions...');
        
        // Add missing columns safely
        const addColumns = `
            ALTER TABLE employees ADD COLUMN IF NOT EXISTS base_salary DECIMAL(12,2);
            ALTER TABLE employees ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(8,2);
            ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_type VARCHAR(20) DEFAULT 'full-time';
        `;
        
        console.log('Adding payroll columns...');
        const { data: colResult, error: colError } = await supabase.rpc('exec_sql', { sql: addColumns });
        if (colError) {
            console.error('Error adding columns:', colError);
        } else {
            console.log('Columns added successfully');
        }
        
        // Test final state
        console.log('\nTesting final table state...');
        const { data, error } = await supabase.from('employees').select('*').limit(3);
        if (error) {
            console.error('Error querying employees:', error);
        } else {
            console.log('Current employees count:', data.length);
            if (data.length > 0) {
                console.log('Sample employee:', data[0]);
            }
        }
        
    } catch (error) {
        console.error('Script error:', error);
    }
}

runSQL();