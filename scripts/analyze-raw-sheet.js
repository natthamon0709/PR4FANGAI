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
const headers = parsed[0];
const dataRows = parsed.slice(1);

console.log('Headers:', headers);
console.log(`Total Rows in Google Sheet: ${dataRows.length}`);

// Analyze unique Users from Sheet
const usersMap = new Map();
const deptsMap = new Map();
const subDeptsMap = new Map();

dataRows.forEach(r => {
  const email = r[1];
  const name = r[2];
  const phone = r[3];
  const position = r[4];
  const dept = r[5];
  const subDept = r[6] || r[7] || r[8] || r[9];

  if (email) {
    usersMap.set(email, { email, name, phone, position, dept, subDept });
  }
  if (dept) {
    deptsMap.set(dept, true);
  }
  if (subDept) {
    subDeptsMap.set(`${dept} > ${subDept}`, { dept, subDept });
  }
});

console.log('\n--- Unique Users in Sheet ---');
usersMap.forEach(u => console.log(`Email: ${u.email}, Name: ${u.name}, Phone: ${u.phone}, Dept: ${u.dept}, SubDept: ${u.subDept}`));

console.log('\n--- Unique Departments in Sheet ---');
deptsMap.forEach((_, d) => console.log(`Dept: ${d}`));

console.log('\n--- Unique Sub-departments in Sheet ---');
subDeptsMap.forEach((_, sd) => console.log(`SubDept: ${sd}`));
