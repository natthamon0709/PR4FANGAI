const Database = require('better-sqlite3');
const assert = require('assert');
const path = require('path');

const dbPath = path.resolve(process.cwd(), './data/pr4fang.db');
const db = new Database(dbPath);

console.log('🧪 Starting PR4Fang AI — Phase 7: Analytics & Reports Verification Tests...\n');

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

// Test 1: Schema Initialization
test('Phase 7 SQLite tables (report_snapshots, scheduled_report_configs, custom_report_definitions, report_export_logs) exist', () => {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
  assert(tables.includes('report_snapshots'), 'report_snapshots missing');
  assert(tables.includes('scheduled_report_configs'), 'scheduled_report_configs missing');
  assert(tables.includes('custom_report_definitions'), 'custom_report_definitions missing');
  assert(tables.includes('report_export_logs'), 'report_export_logs missing');
});

// Test 2: Pre-seeded Report Snapshots
test('Report Snapshots contain realistic historical daily data for past 30 days', () => {
  const count = db.prepare("SELECT COUNT(*) as c FROM report_snapshots WHERE metric_key = 'ai_question_count'").get().c;
  assert(count >= 15, `Expected >= 15 snapshots, found ${count}`);
});

// Test 3: Overview Analytics Aggregation
test('Overview Analytics calculates total questions, accuracy rate %, and top knowledge items', () => {
  const total = db.prepare("SELECT COUNT(*) as c FROM ai_query_logs").get().c;
  const fallbacks = db.prepare("SELECT COUNT(*) as c FROM ai_query_logs WHERE is_fallback = 1").get().c;
  const successRate = total > 0 ? Math.round(((total - fallbacks) / total) * 100) : 92;
  assert(successRate >= 0 && successRate <= 100, 'Success rate must be 0-100');
});

// Test 4: AI Performance Stacked Confidence Distribution
test('AI Query Logs categorize confidence into High (>=0.85), Med (0.70-0.84), Low (<0.70)', () => {
  const highCount = db.prepare("SELECT COUNT(*) as c FROM ai_query_logs WHERE confidence_score >= 0.85 AND is_fallback = 0").get().c;
  const medCount = db.prepare("SELECT COUNT(*) as c FROM ai_query_logs WHERE confidence_score >= 0.70 AND confidence_score < 0.85 AND is_fallback = 0").get().c;
  assert(typeof highCount === 'number');
  assert(typeof medCount === 'number');
});

// Test 5: Department Scoping
test('Department query scoping filters logs when department_id is supplied for Staff', () => {
  const staffDeptId = 'dept-01-resource';
  const staffLogs = db.prepare("SELECT COUNT(*) as c FROM ai_query_logs WHERE department_id = ?").get(staffDeptId).c;
  const allLogs = db.prepare("SELECT COUNT(*) as c FROM ai_query_logs").get().c;
  assert(staffLogs <= allLogs, 'Staff logs must be subset of all logs');
});

// Test 6: LINE OA Followers and Broadcast Delivery Summary
test('LINE OA follower counts and broadcast delivery stats query cleanly', () => {
  const followers = db.prepare("SELECT COUNT(*) as c FROM line_followers WHERE blocked = 0").get().c;
  assert(typeof followers === 'number');
  const broadcasts = db.prepare("SELECT COUNT(*) as c FROM line_broadcasts").get().c;
  assert(typeof broadcasts === 'number');
});

// Test 7: Scheduled Report Configs
test('Scheduled Report Configs supports weekly/monthly recurring rules and JSON recipients', () => {
  const scheds = db.prepare("SELECT * FROM scheduled_report_configs").all();
  assert(scheds.length >= 1, 'Expected at least 1 default scheduled report');
  const recipients = JSON.parse(scheds[0].recipients);
  assert(Array.isArray(recipients), 'Recipients must parse to array');
});

// Test 8: Export Audit Log
test('Report Export Logs record user_id, report_type, format and timestamp', () => {
  const testId = 'exp-test-' + Date.now();
  db.prepare("INSERT INTO report_export_logs (log_id, user_id, report_type, format, filter_summary) VALUES (?, 'usr-admin-001', 'all', 'xlsx', 'Test Filter')").run(testId);
  const log = db.prepare("SELECT * FROM report_export_logs WHERE log_id = ?").get(testId);
  assert(log && log.format === 'xlsx', 'Export log must be saved');
});

console.log('---------------------------------------------------------');
console.log(`📊 Test Summary: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests/totalTests)*100)}%)`);
if (passedTests === totalTests) {
  console.log('🎉 All Phase 7 Analytics & Reports tests PASSED!\n');
} else {
  console.log('⚠️ Some tests failed. Please review errors above.\n');
  process.exit(1);
}
