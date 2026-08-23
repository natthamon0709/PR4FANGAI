const https = require('https');

const SHEET_ID = '1-zp32f6bkCcXpGo5O__moHCAXcm_Sjg0rTPRkTK6fYs';
const GID = '547794364';
const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;

console.log('📡 Testing live fetch from Google Sheet URL:', csvUrl);

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Follow redirect if 301, 302, 307
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

fetchUrl(csvUrl)
  .then(csv => {
    const lines = csv.split('\n');
    console.log(`✅ Successfully fetched live Google Sheet CSV! (Total lines: ${lines.length}, bytes: ${csv.length})`);
    console.log('Header line:', lines[0]?.substring(0, 100));
    console.log('First data row:', lines[1]?.substring(0, 100));
  })
  .catch(err => {
    console.log('⚠️ Fetch failed (likely due to sandbox network isolation or offline):', err.message);
  });
