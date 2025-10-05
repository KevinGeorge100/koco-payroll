require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function runSQL() {
    try {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
        const sql = fs.readFileSync('./backend/ultra-safe-employee-setup.sql', 'utf8');
        
        console.log('Executing ultra-safe employee setup SQL...');
        
        // Split SQL into individual statements
        const statements = sql.split(';').filter(s => s.trim().length > 0);
        
        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i].trim();
            if (stmt && !stmt.startsWith('--') && !stmt.startsWith('SELECT \'')) {
                console.log(`Executing statement ${i + 1}/${statements.length}`);
                const { data, error } = await supabase.rpc('execute_sql', { sql: stmt + ';' });
                if (error) {
                    console.error(`Error in statement ${i + 1}:`, error);
                } else {
                    console.log(`Statement ${i + 1} executed successfully`);
                }
            }
        }
        
        // Test final state
        console.log('\nTesting final table state...');
        const { data, error } = await supabase.from('employees').select('*').limit(5);
        if (error) {
            console.error('Error querying employees:', error);
        } else {
            console.log('Current employees:', data);
        }
        
    } catch (error) {
        console.error('Script error:', error);
    }
}

runSQL();