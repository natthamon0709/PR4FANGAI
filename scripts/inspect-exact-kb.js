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

function parseCSV(text) {
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

const parsed = parseCSV(csvText);
const dataRows = parsed.slice(1);

console.log(`📋 Exact Rows in Google Sheet Knowledge_Base (Total: ${dataRows.length} rows):`);
dataRows.forEach((r, idx) => {
  const dept = r[5];
  const subDept = r[6] || r[7] || r[8] || r[9] || '-';
  const type = r[10];
  const title = r[11];
  console.log(`  ${idx + 1}. [${type}] ${title} (${dept} > ${subDept})`);
});
