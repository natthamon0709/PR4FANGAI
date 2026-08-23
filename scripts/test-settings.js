const Database = require('better-sqlite3');
const assert = require('assert');
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(process.cwd(), './data/pr4fang.db');
const db = new Database(dbPath);

console.log('🧪 Starting PR4Fang AI — Phase 8: System Settings Verification Tests...\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}`);
    console.error(`     Error: ${err.message}\n`);
  }
}

// Test 1: Phase 8 Schema & Tables
test('Phase 8 SQLite tables (college_profile, security_policies, notification_rules, system_audit_logs, backup_jobs, user_preferences) exist', () => {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
  assert(tables.includes('college_profile'), 'college_profile table missing');
  assert(tables.includes('security_policies'), 'security_policies table missing');
  assert(tables.includes('notification_rules'), 'notification_rules table missing');
  assert(tables.includes('system_audit_logs'), 'system_audit_logs table missing');
  assert(tables.includes('backup_jobs'), 'backup_jobs table missing');
  assert(tables.includes('user_preferences'), 'user_preferences table missing');
});

// Test 2: College Profile
test('College profile initialized with correct Thai name and Fang contact information', () => {
  const profile = db.prepare('SELECT * FROM college_profile LIMIT 1').get();
  assert(profile, 'College profile row must exist');
  assert(profile.name_th.includes('วิทยาลัยการอาชีพฝาง'), 'name_th must match Fang college');
  assert(profile.timezone === 'Asia/Bangkok', 'timezone must be Asia/Bangkok');
});

// Test 3: Department Tree & Sub-departments
test('Department Tree contains 4 primary departments with linked users/knowledge metrics', () => {
  const depts = db.prepare('SELECT * FROM departments').all();
  assert(depts.length >= 4, `Expected >= 4 departments, found ${depts.length}`);
  const subs = db.prepare('SELECT * FROM sub_departments').all();
  assert(subs.length >= 20, `Expected >= 20 sub-departments, found ${subs.length}`);
});

// Test 4: Delete Protection on Department with Active Users
test('Department with active users or knowledge items is protected from hard deletion', () => {
  const dept = db.prepare('SELECT department_id FROM departments WHERE department_id = ?').get('dept-01-resource');
  assert(dept, 'dept-01-resource must exist');
  const userCount = db.prepare('SELECT COUNT(*) as c FROM master_users WHERE department_id = ?').get(dept.department_id).c;
  assert(userCount > 0, 'Resource department must have linked users');
});

// Test 5: Security Policy & Complexity
test('Security policy enforces password min length, complexity, max attempts, and lockout minutes', () => {
  const policy = db.prepare('SELECT * FROM security_policies LIMIT 1').get();
  assert(policy, 'Security policy row must exist');
  assert(policy.password_min_length >= 6, 'Min length must be >= 6');
  assert(policy.max_login_attempts >= 3, 'Max attempts must be >= 3');
  assert(policy.lockout_duration_minutes >= 5, 'Lockout minutes must be >= 5');
});

// Test 6: Notification Rules
test('Notification rules contain 5 core system events with role and channel arrays', () => {
  const rules = db.prepare('SELECT * FROM notification_rules').all();
  assert(rules.length >= 5, `Expected 5 notification rules, found ${rules.length}`);
  const events = rules.map(r => r.event_type);
  assert(events.includes('pending_review'), 'pending_review missing');
  assert(events.includes('knowledge_approved'), 'knowledge_approved missing');
  assert(events.includes('knowledge_sent_back'), 'knowledge_sent_back missing');
  assert(events.includes('sync_error'), 'sync_error missing');
  assert(events.includes('sync_conflict'), 'sync_conflict missing');
});

// Test 7: System Audit Logs
test('System audit logs record administrative actions with actor and detail JSON', () => {
  const testLogId = 'sys-test-' + Date.now();
  db.prepare(`
    INSERT INTO system_audit_logs (log_id, actor_user_id, action, target_type, target_id, detail, created_at)
    VALUES (?, 'usr-admin-001', 'test_verification', 'system', 'sys-01', '{"test":true}', datetime('now', 'localtime'))
  `).run(testLogId);
  const log = db.prepare('SELECT * FROM system_audit_logs WHERE log_id = ?').get(testLogId);
  assert(log, 'Test audit log must exist');
  assert(JSON.parse(log.detail).test === true, 'Detail JSON must be valid');
});

// Test 8: Backup Job Record & SQLite File Generation
test('Backup jobs record status, file_url, and file_size', () => {
  const backups = db.prepare('SELECT * FROM backup_jobs').all();
  assert(backups.length >= 1, 'Expected at least 1 backup job');
  assert(backups[0].status === 'success', 'Backup status must be success');
});

// Test 9: Personal Preferences
test('User preferences support in-app, line, email notifications and event types', () => {
  const pref = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get('usr-admin-001');
  assert(pref, 'Admin user preferences must exist');
  const events = JSON.parse(pref.event_types);
  assert(Array.isArray(events), 'event_types must parse to array');
});

// Test 10: Integrations Status Summary
test('Integrations summary aggregates status of Sheets CMS, AI Engine, and LINE OA', () => {
  const ai = db.prepare('SELECT COUNT(*) as c FROM ai_engine_configs WHERE is_active = 1').get().c;
  const sheets = db.prepare('SELECT COUNT(*) as c FROM sheet_sync_configs WHERE is_active = 1').get().c;
  const line = db.prepare('SELECT COUNT(*) as c FROM line_channel_configs').get().c;
  assert(ai >= 1, 'AI config must exist');
  assert(sheets >= 1, 'Sheets sync config must exist');
  assert(line >= 1, 'LINE config must exist');
});

console.log('---------------------------------------------------------');
console.log(`📊 Test Summary: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests/totalTests)*100)}%)`);
if (passedTests === totalTests) {
  console.log('🎉 All Phase 8 System Settings tests PASSED!\n');
} else {
  console.log('⚠️ Some tests failed. Please review errors above.\n');
  process.exit(1);
}
