async function check() {
  const res = await fetch('https://velocce-saas.vercel.app');
  const html = await res.text();
  console.log('HTML status:', res.status);
  const match = html.match(/src="(\/assets\/[^"]+\.js)"/);
  if (match) {
    const jsUrl = 'https://velocce-saas.vercel.app' + match[1];
    console.log('Script URL:', jsUrl);
    const jsRes = await fetch(jsUrl);
    const jsText = await jsRes.text();
    console.log('Bundle length:', jsText.length);
    console.log('Has velocce-system-updates?', jsText.includes('velocce-system-updates'));
    console.log('Has definitivamente suspendido?', jsText.includes('definitivamente suspendido'));
    console.log('Has VELOCCE-2026?', jsText.includes('VELOCCE-2026'));
  } else {
    console.log('No assets/js found in HTML:', html);
  }
}
check();
