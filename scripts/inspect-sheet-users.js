const fs = require('fs');
const path = require('path');

const csvPath = path.join('/Users/nut/.gemini/antigravity/brain/063f5410-d080-4eea-98bd-e85d580bfa9c/.system_generated/steps/219/content.md');
const content = fs.readFileSync(csvPath, 'utf8');

const lines = content.split('\n');
let headerIdx = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('"Timestamp","Email Address"')) {
    headerIdx = i;
    break;
  }
}

const csvText = lines.slice(headerIdx).join('\n');
const parseCSV = require('./import-google-sheets.js');

// Parse CSV manually
function parseCSVRaw(text) {
  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') i++;
      currentRow.push(currentVal.trim());
      if (currentRow.some(c => c !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some(c => c !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

const parsed = parseCSVRaw(csvText);
const dataRows = parsed.slice(1);

dataRows.forEach((r, idx) => {
  console.log(`Row ${idx + 2}:`);
  console.log(`  - Recorder (r[2]): ${r[2]}`);
  console.log(`  - Dept (r[5]): ${r[5]}`);
  console.log(`  - SubDept: ${r[6] || r[7] || r[8] || r[9]}`);
  console.log(`  - Type: ${r[10]}`);
  console.log(`  - Title: ${r[11]}`);
  console.log(`  - Resp Name (r[23]): ${r[23]}`);
  console.log(`  - Resp Email (r[24]): ${r[24]}`);
  console.log(`  - Resp Phone (r[25]): ${r[25]}`);
  console.log('---');
});
