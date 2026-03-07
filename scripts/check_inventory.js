import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    const { data, error } = await supabase.from('inventory').select('id, name');
    if (error) {
        console.error("Error fetching:", error);
    } else {
        console.log(`Found ${data.length} items in inventory.`);
        if (data.length > 0) {
            console.log("First item:", data[0]);
        }
    }
}

check();
