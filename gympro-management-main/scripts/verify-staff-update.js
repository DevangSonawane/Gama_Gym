
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

async function verifyUpdate() {
  console.log('🔍 Verifying Staff Update...');

  // 1. Fetch a staff member
  const { data: staff, error: fetchError } = await supabase
    .from('staff')
    .select('*')
    .limit(1)
    .single();

  if (fetchError || !staff) {
    console.error('❌ Could not fetch a staff member to test update:', fetchError);
    return;
  }

  console.log(`   Found staff: ${staff.first_name} ${staff.last_name} (ID: ${staff.id})`);

  // 2. Attempt update with same logic as fixed StaffEdit.tsx
  // Sending salary as number, role as string
  const updatePayload = {
    salary: 65000, // Number
    role: staff.role, // String
    updated_at: new Date().toISOString()
  };

  console.log('   Attempting update with payload:', updatePayload);

  const { data: updateData, error: updateError } = await supabase
    .from('staff')
    .update(updatePayload)
    .eq('id', staff.id)
    .select();

  if (updateError) {
    console.error('❌ Update failed:', updateError);
    // Try with string salary to see if that was the issue (reverse check)
    console.log('   Retrying with string salary to compare...');
    const { error: stringError } = await supabase
      .from('staff')
      .update({ ...updatePayload, salary: "65000" })
      .eq('id', staff.id);
    
    if (stringError) {
      console.log('   String salary also failed:', stringError.message);
    } else {
      console.log('   ⚠️ String salary SUCCEEDED? Then why did it fail for user?');
    }

  } else {
    console.log('✅ Update successful!');
    console.log('   Updated record:', updateData[0]);
    
    // Revert changes
    await supabase.from('staff').update({ salary: staff.salary }).eq('id', staff.id);
    console.log('   Reverted changes.');
  }
}

verifyUpdate();
