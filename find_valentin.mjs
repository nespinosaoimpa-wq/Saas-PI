
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oanurhkxqdxtqoauiizy.supabase.co',
  'sb_publishable_DlDSyq8nUsw5D-SkGd6dyw_9rULN-gE'
);

async function check() {
  const { data: emps } = await supabase.from('employees').select('id, name').ilike('name', '%valentin%');
  console.log('Employees found:', emps);
  
  if (emps && emps.length > 0) {
    const valentinId = emps[0].id;
    const { data: logs } = await supabase.from('attendance_logs')
      .select('*')
      .eq('employee_id', valentinId)
      .gte('timestamp', '2026-04-10T00:00:00')
      .lte('timestamp', '2026-04-12T00:00:00')
      .order('timestamp', { ascending: true });
    
    console.log('Logs for Valentin:', logs);
  }
}

check();
