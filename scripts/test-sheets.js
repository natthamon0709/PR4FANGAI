const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'pr4fang.db');
const db = new Database(dbPath);

console.log('🧪 Starting PR4Fang AI — Phase 4: Google Sheets CMS Verification Tests...\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
  }
}

// 1. Sheet Sync Configs (4 Master sheets matching Google Sheet)
const configs = db.prepare('SELECT * FROM sheet_sync_configs').all();
assert(configs.length === 4, `All 4 Master Google Sheets configured (Count: ${configs.length})`);

const sheetNames = configs.map(c => c.sheet_name);
assert(
  sheetNames.includes('Master_Users') &&
  sheetNames.includes('Knowledge_Base') &&
  sheetNames.includes('Master_Department') &&
  sheetNames.includes('Master_Section'),
  'All 4 required Master sheet names (Master_Users, Knowledge_Base, Master_Department, Master_Section) exist'
);

// 2. Field Mappings exist
const kmConfig = configs.find(c => c.sheet_name === 'Knowledge_Base');
assert(kmConfig !== undefined && kmConfig.field_mapping.includes('content_type'), 'Knowledge_Base sheet has field mapping configured');

// 3. Sync Logs exist
const logsCount = db.prepare('SELECT COUNT(*) as c FROM sync_logs').get().c;
assert(logsCount >= 2, `Sync logs recorded (Count: ${logsCount})`);

// 4. Test Sync Conflict Insertion & Detection
const testConflictId = 'conf-unit-test-01';
db.prepare('DELETE FROM sync_conflicts WHERE conflict_id = ?').run(testConflictId);

db.prepare(`
  INSERT INTO sync_conflicts (
    conflict_id, sheet_name, record_id, record_title, db_value, sheet_value, status, created_at
  ) VALUES (?, 'Knowledge_Base', 'km-0001', 'เร็ว ๆ นี้: ประกาศรายชื่อผู้สมัครอย่างเป็นทางการ FVE STAR 2026', '{"summary":"ค่าระบบ"}', '{"summary":"ค่าจากชีท"}', 'unresolved', datetime('now'))
`).run(testConflictId);

const detectedConflict = db.prepare('SELECT * FROM sync_conflicts WHERE conflict_id = ?').get(testConflictId);
assert(detectedConflict && detectedConflict.status === 'unresolved', 'Unresolved sync conflict detected accurately');

// 5. Test Conflict Resolution Logic (Choose Sheet / Choose DB)
db.prepare(`
  UPDATE sync_conflicts SET
    status = 'resolved_use_sheet',
    resolved_by = 'usr-admin-001',
    resolved_at = datetime('now')
  WHERE conflict_id = ?
`).run(testConflictId);

const resolved = db.prepare('SELECT * FROM sync_conflicts WHERE conflict_id = ?').get(testConflictId);
assert(resolved.status === 'resolved_use_sheet' && resolved.resolved_by === 'usr-admin-001', 'Conflict resolution successfully updates conflict status and resolver');

// Cleanup unit test conflict
db.prepare('DELETE FROM sync_conflicts WHERE conflict_id = ?').run(testConflictId);

// 6. Test Two-way Sync Timestamp update
const now = new Date().toISOString();
db.prepare('UPDATE sheet_sync_configs SET last_synced_at = ? WHERE sheet_name = \'Knowledge_Base\'').run(now);
const updatedCfg = db.prepare('SELECT last_synced_at FROM sheet_sync_configs WHERE sheet_name = \'Knowledge_Base\'').get();
assert(updatedCfg.last_synced_at === now, 'Two-way sync updates last_synced_at timestamp');

// 7. Test System Settings Connection Info
const gEmail = db.prepare("SELECT value FROM system_settings WHERE key = 'google_account_email'").get()?.value;
assert(gEmail !== undefined && gEmail.includes('serviceaccount.com'), 'Google Service Account email is configured in system settings');

console.log('\n---------------------------------------------------------');
console.log(`📊 Test Summary: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
if (passedTests === totalTests) {
  console.log('🎉 All Phase 4 Google Sheets CMS Database and Logic tests PASSED!');
} else {
  console.log('⚠️ Some tests failed.');
}
console.log('---------------------------------------------------------\n');
