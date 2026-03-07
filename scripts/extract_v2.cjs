const fs = require('fs');
const content = fs.readFileSync('vercel_app.js', 'utf8');

const urlRegex = /https:\/\/[a-z0-9]+\.supabase\.co/g;
const keyRegex = /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g;

const urls = [...new Set(content.match(urlRegex))];
const keys = [...new Set(content.match(keyRegex))];

console.log('--- RESULTS ---');
console.log('URLs:', urls);
console.log('Keys:', keys);
console.log('--- END ---');
