require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function runSQL() {
    try {
        console.log('Supabase URL:', process.env.SUPABASE_URL ? 'Found' : 'Missing');
        console.log('Supabase Key:', process.env.SUPABASE_ANON_KEY ? 'Found' : 'Missing');
        
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        
        console.log('Adding missing payroll columns...');
        
        // Add missing columns safely - one at a time
        const columns = [
            'ALTER TABLE employees ADD COLUMN IF NOT EXISTS base_salary DECIMAL(12,2);',
            'ALTER TABLE employees ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(8,2);',
            'ALTER TABLE employees ADD COLUMN IF NOT EXISTS employment_type VARCHAR(20) DEFAULT \'full-time\';'
        ];
        
        for (let i = 0; i < columns.length; i++) {
            console.log(`Adding column ${i + 1}/${columns.length}...`);
            const { data, error } = await supabase.rpc('exec_sql', { sql: columns[i] });
            if (error) {
                console.error(`Error adding column ${i + 1}:`, error);
            } else {
                console.log(`Column ${i + 1} added successfully`);
            }
        }
        
        // Test final state
        console.log('\nTesting table structure...');
        const { data, error } = await supabase.from('employees').select('*').limit(2);
        if (error) {
            console.error('Error querying employees:', error);
        } else {
            console.log('Employee query successful. Found', data.length, 'employees');
            if (data.length > 0) {
                console.log('Available columns:', Object.keys(data[0]));
            }
        }
        
    } catch (error) {
        console.error('Script error:', error);
    }
}

runSQL();