const https = require('https');

https.get('https://saas-pi-tau.vercel.app', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        const jsMatch = data.match(/src="(\/assets\/index-[^"]+\.js)"/);
        if (jsMatch) {
            const jsUrl = 'https://saas-pi-tau.vercel.app' + jsMatch[1];
            https.get(jsUrl, (jsRes) => {
                let jsData = '';
                jsRes.on('data', chunk => jsData += chunk);
                jsRes.on('end', () => {
                    const supabaseUrlMatch = jsData.match(/https:\/\/[a-z0-9]+\.supabase\.co/g);
                    const supabaseKeyMatch = jsData.match(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g);

                    console.log("URLs Found:", [...new Set(supabaseUrlMatch)]);
                    console.log("Keys Found:", [...new Set(supabaseKeyMatch)]);
                });
            });
        }
    });
});
