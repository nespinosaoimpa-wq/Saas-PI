const https = require('https');

const options = {
    hostname: 'sksytdgylhffedofbdfj.supabase.co',
    port: 443,
    path: '/rest/v1/inventory?select=*',
    method: 'GET',
    headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrc3l0ZGd5bGhmZmVkb2ZiZGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NjU0MzAsImV4cCI6MjA1NjI0MTQzMH0.sw5D-SkGd6dyw_9rULN-gETV800-4bJ3D3tIun6N7H0',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrc3l0ZGd5bGhmZmVkb2ZiZGZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2NjU0MzAsImV4cCI6MjA1NjI0MTQzMH0.sw5D-SkGd6dyw_9rULN-gETV800-4bJ3D3tIun6N7H0'
    }
};

const req = https.request(options, res => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => console.log('Response:', res.statusCode, data.substring(0, 200)));
});

req.on('error', error => console.error('Error:', error.message));
req.end();
