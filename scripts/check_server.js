(async ()=>{
  try {
    const r = await fetch('http://localhost:3000');
    console.log('status', r.status);
    const t = await r.text();
    console.log('bodyPreview', t.slice(0,120).replace(/\n/g,' '));
  } catch (e) {
    console.error('error', e.message || e);
    process.exit(1);
  }
})();
