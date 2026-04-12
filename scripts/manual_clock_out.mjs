
const url = 'https://oanurhkxqdxtqoauiizy.supabase.co/rest/v1';
const key = 'sb_publishable_DlDSyq8nUsw5D-SkGd6dyw_9rULN-gE';
const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
};

async function fixAttendance() {
    try {
        // 1. Find Fernando
        const empRes = await fetch(`${url}/employees?name=ilike.*Fernando*`, { headers });
        const employees = await empRes.json();
        if (employees.length === 0) {
            console.log('Fernando NOT found in "employees" table. Checking "user_profiles"...');
            const upRes = await fetch(`${url}/user_profiles?full_name=ilike.*Fernando*`, { headers });
            const userProfiles = await upRes.json();
            if (userProfiles.length === 0) {
                console.log('Fernando NOT found anywhere.');
                return;
            }
            employees.push(...userProfiles);
        }
        
        const fernando = employees[0];
        console.log(`Found Fernando: ${fernando.id} - ${fernando.full_name || fernando.name}`);

        // 2. Register OUT log
        const outLog = {
            employee_id: fernando.id,
            employee_name: fernando.full_name || fernando.name || 'Fernando',
            type: 'OUT',
            timestamp: new Date('2026-04-07T19:00:00-03:00').toISOString(),
            time_display: '19:00'
        };

        const res = await fetch(`${url}/attendance_logs`, {
            method: 'POST',
            headers,
            body: JSON.stringify(outLog)
        });
        
        if (!res.ok) {
            const err = await res.text();
            throw new Error(`Error inserting: ${err}`);
        }
        
        const result = await res.json();
        console.log('✅ Salida registrada con éxito:', result);
    } catch (e) {
        console.error('❌ Error:', e.message);
    }
}

fixAttendance();
