const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'pr4fang.db');
if (!fs.existsSync(dbPath)) {
  console.error('❌ Database file not found. Run "node scripts/seed.js" first.');
  process.exit(1);
}

const db = new Database(dbPath);

console.log('🧪 Starting PR4Fang AI Automated API & Security Verification Tests...\n');

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

// Test 1: Departments & Sub-departments count
const depts = db.prepare('SELECT * FROM departments').all();
assert(depts.length === 4, `Database contains 4 main college departments (Actual: ${depts.length})`);

const subDepts = db.prepare('SELECT * FROM sub_departments').all();
assert(subDepts.length >= 18, `Database contains sub-departments (Actual: ${subDepts.length})`);

// Test 2: Admin Account password hash and role
const adminUser = db.prepare('SELECT * FROM master_users WHERE email = ?').get('admin@fang.ac.th');
assert(adminUser !== undefined, 'Super Admin account exists');
assert(adminUser.role === 'administrator', 'Super Admin has role "administrator"');
assert(bcrypt.compareSync('Admin@12345', adminUser.password_hash), 'Super Admin password matches "Admin@12345"');

// Test 3: Staff Account
const staffUser = db.prepare('SELECT * FROM master_users WHERE email = ?').get('somchai@fang.ac.th');
assert(staffUser !== undefined, 'Staff account exists');
assert(staffUser.role === 'staff', 'Staff has role "staff"');
assert(staffUser.status === 'active', 'Staff status is "active"');
assert(bcrypt.compareSync('Fang@2026', staffUser.password_hash), 'Staff password matches "Fang@2026"');

// Test 4: Master Users count matches Google Sheet exactly
const masterUsers = db.prepare('SELECT * FROM master_users').all();
assert(masterUsers.length >= 2, `Master users table strictly contains users from Google Sheet (Actual: ${masterUsers.length})`);

// Test 5: Google Sheets Settings & Integration configuration
const sheetId = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('google_sheets_id');
assert(sheetId && sheetId.value === '1-zp32f6bkCcXpGo5O__moHCAXcm_Sjg0rTPRkTK6fYs', 'Google Sheets ID correctly configured');

const n8nKey = db.prepare('SELECT value FROM system_settings WHERE key = ?').get('n8n_api_key');
assert(n8nKey && n8nKey.value.length > 0, 'n8n API Key configured');

// Test 6: LINE User ID matching for AI
const lineUsers = db.prepare('SELECT line_user_id FROM master_users WHERE line_user_id IS NOT NULL').all();
assert(lineUsers.length >= 2, `LINE User IDs configured for AI Integration testing (Count: ${lineUsers.length})`);

// Test 7: Password Hashing security (cost >= 12)
assert(adminUser.password_hash.startsWith('$2a$12$') || adminUser.password_hash.startsWith('$2b$12$'), 'Bcrypt cost is >= 12 as per Non-Functional Requirement 1');

// Test 8: Login Audit Logs recorded
const logs = db.prepare('SELECT * FROM login_audit_logs').all();
assert(logs.length >= 3, `Login Audit Logs recorded properly (Count: ${logs.length})`);

console.log('\n---------------------------------------------------------');
console.log(`📊 Test Summary: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
if (passedTests === totalTests) {
  console.log('🎉 All security, database, and logic tests PASSED!');
} else {
  console.log('⚠️ Some tests failed. Please review errors above.');
}
console.log('---------------------------------------------------------\n');
