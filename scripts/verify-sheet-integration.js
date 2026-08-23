const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'pr4fang.db');
const db = new Database(dbPath);

console.log('🔍 Auditing Google Sheets Integration Touchpoints...\n');

let issues = [];
let passes = [];

function check(desc, condition, failReason) {
  if (condition) {
    passes.push(desc);
  } else {
    issues.push(`${desc}: ${failReason}`);
  }
}

// 1. Check System Settings in Database
const sheetIdRow = db.prepare("SELECT value FROM system_settings WHERE key = 'google_sheets_id'").get();
const gidRow = db.prepare("SELECT value FROM system_settings WHERE key = 'google_sheets_gid'").get();
const lastSyncedRow = db.prepare("SELECT value FROM system_settings WHERE key = 'google_sheets_last_synced'").get();

check('DB Sheet ID matches 1-zp32f6bkCcXpGo5O__moHCAXcm_Sjg0rTPRkTK6fYs', 
  sheetIdRow && sheetIdRow.value === '1-zp32f6bkCcXpGo5O__moHCAXcm_Sjg0rTPRkTK6fYs', 
  `Got ${sheetIdRow ? sheetIdRow.value : 'null'}`);

check('DB GID matches 547794364', 
  gidRow && gidRow.value === '547794364', 
  `Got ${gidRow ? gidRow.value : 'null'}`);

// 2. Check pending sync counts in knowledge_items
const pendingKnowledge = db.prepare("SELECT COUNT(*) as c FROM knowledge_items WHERE sync_status = 'pending'").get().c;
const syncedKnowledge = db.prepare("SELECT COUNT(*) as c FROM knowledge_items WHERE sync_status = 'synced'").get().c;
check('Pending sync items tracking', pendingKnowledge === 3, `Expected 3 pending, got ${pendingKnowledge}`);
check('Synced items tracking', syncedKnowledge > 0, `Expected synced items > 0, got ${syncedKnowledge}`);

// 3. Check Users export structure
const users = db.prepare(`
  SELECT 
    u.user_id, u.first_name, u.last_name, u.email, u.phone,
    d.name as department_name, s.name as sub_department_name,
    u.role, u.status, u.line_user_id
  FROM master_users u
  LEFT JOIN departments d ON u.department_id = d.department_id
  LEFT JOIN sub_departments s ON u.sub_department_id = s.sub_department_id
`).all();

check('Master Users table has records to export to Sheet', users.length >= 10, `Got ${users.length} users`);

// 4. Check files in codebase referencing Sheet ID
const filesToCheck = [
  'src/lib/integrations.ts',
  'src/components/dashboard/SheetSyncStatusCard.tsx',
  'src/app/integrations/page.tsx',
  'n8n-workflow-pr4fang-ai.json',
  'README.md'
];

for (const file of filesToCheck) {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const hasSheetId = content.includes('1-zp32f6bkCcXpGo5O__moHCAXcm_Sjg0rTPRkTK6fYs');
    check(`File ${file} contains correct Sheet ID`, hasSheetId, 'Missing Sheet ID in file content');
  } else {
    issues.push(`File missing: ${file}`);
  }
}

console.log('✅ Passed checks:');
passes.forEach(p => console.log(`  ✓ ${p}`));

if (issues.length > 0) {
  console.log('\n⚠️ Found issues:');
  issues.forEach(i => console.log(`  ✗ ${i}`));
} else {
  console.log('\n🎉 All 9 Google Sheet integration touchpoints VERIFIED!');
}

console.log('\n📊 Google Sheet Summary Status:');
console.log(`- Spreadsheet URL: https://docs.google.com/spreadsheets/d/${sheetIdRow.value}/edit?gid=${gidRow.value}#gid=${gidRow.value}`);
console.log(`- Pending Sync Items on Dashboard: ${pendingKnowledge} รายการ`);
console.log(`- Master Users to Sync: ${users.length} บัญชี`);
console.log(`- Last Synced Timestamp: ${lastSyncedRow ? lastSyncedRow.value : 'None'}`);
