
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://oanurhkxqdxtqoauiizy.supabase.co',
  'sb_publishable_DlDSyq8nUsw5D-SkGd6dyw_9rULN-gE'
);

async function fix() {
  const logId = '839f348b-9fa6-4ae2-85d2-900e9b262a70';
  // 10/04 21:00 ART is 11/04 00:00 UTC (assuming ART is UTC-3)
  // Let's use local-looking string if the DB is insensitive or just ISO.
  // The existing logs have +00:00. 
  // 21:00 ART -> 00:00 UTC (+1 day)
  const newTimestamp = '2026-04-11T00:00:00.000+00:00';
  const newDisplay = '09:00 p. m.';

  console.log('Updating log', logId, 'to', newTimestamp);
  
  const { data, error } = await supabase
    .from('attendance_logs')
    .update({ 
      timestamp: newTimestamp,
      time_display: newDisplay
    })
    .eq('id', logId)
    .select();

  if (error) {
    console.error('Error updating log:', error);
  } else {
    console.log('Update successful:', data);
  }
}

fix();
