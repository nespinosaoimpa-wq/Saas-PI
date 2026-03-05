import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oanurhkxqdxtqoauiizy.supabase.co';
const supabaseKey = 'sb_publishable_DlDSyq8nUsw5D-SkGd6dyw_9rULN-gE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log("Testing Supabase connection...");
    const { data, error } = await supabase.from('employees').select('*').limit(1);
    console.log("Data:", data);
    console.log("Error:", error);
}

test();
