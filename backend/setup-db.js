// Database setup script to run the SQL files
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runSQLFile(filePath) {
  try {
    console.log(`\n📄 Running SQL file: ${path.basename(filePath)}`);
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    
    // Split by semicolons and filter out empty statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`⚡ Executing: ${statement.substring(0, 100)}...`);
        const { error } = await supabase.rpc('exec_sql', { query: statement + ';' });
        
        if (error) {
          console.error(`❌ Error executing statement: ${error.message}`);
          console.error(`Statement: ${statement}`);
        } else {
          console.log(`✅ Statement executed successfully`);
        }
      }
    }
    
    console.log(`✅ Completed SQL file: ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`❌ Error running SQL file ${filePath}:`, error.message);
  }
}

async function setupDatabase() {
  console.log('🚀 Setting up KOCO Payroll Database...\n');

  const sqlFiles = [
    path.join(__dirname, 'leaves-table-setup.sql'),
    path.join(__dirname, 'payroll-table-setup.sql')
  ];

  for (const sqlFile of sqlFiles) {
    if (fs.existsSync(sqlFile)) {
      await runSQLFile(sqlFile);
    } else {
      console.log(`⚠️  SQL file not found: ${sqlFile}`);
    }
  }

  console.log('\n🎉 Database setup completed!');
}

setupDatabase().catch(console.error);