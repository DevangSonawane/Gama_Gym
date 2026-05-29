
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
  console.log('🔍 Inspecting Staff Table Schema...');

  // 1. Fetch one row to see columns and values
  const { data: staffData, error: staffError } = await supabase
    .from('staff')
    .select('*')
    .limit(1);

  if (staffError) {
    console.error('❌ Error fetching staff:', staffError);
  } else if (staffData && staffData.length > 0) {
    console.log('✅ Staff Row Sample:', staffData[0]);
    console.log('   Keys:', Object.keys(staffData[0]));
    console.log('   Role value:', staffData[0].role);
    console.log('   Salary value:', staffData[0].salary, 'Type:', typeof staffData[0].salary);
  } else {
    console.log('⚠️ No staff records found.');
  }
}

inspectSchema();
