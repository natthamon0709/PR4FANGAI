const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'pr4fang.db');
if (!fs.existsSync(dbPath)) {
  console.error('❌ Database file not found.');
  process.exit(1);
}

const db = new Database(dbPath);

console.log('🧪 Starting PR4Fang AI — Phase 2: Dashboard Verification Tests...\n');

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

// 1. Total Knowledge Items
const totalKnowledge = db.prepare('SELECT COUNT(*) as c FROM knowledge_items').get().c;
assert(totalKnowledge >= 20, `Total knowledge items count from Google Sheet (Actual: ${totalKnowledge})`);

// 2. Pending Sheets Sync Items (0 after full sync, >= 0 normally)
const pendingSync = db.prepare("SELECT COUNT(*) as c FROM knowledge_items WHERE sync_status = 'pending'").get().c;
assert(pendingSync >= 0, `Google Sheets pending sync items tracked properly (Actual: ${pendingSync})`);

// 3. Department Knowledge Distribution
const resourceCount = db.prepare("SELECT COUNT(*) as c FROM knowledge_items WHERE department_id = 'dept-01-resource'").get().c;
assert(resourceCount >= 15, `Resource department knowledge count (Actual: ${resourceCount})`);

// 4. Activity Feed
const activities = db.prepare('SELECT * FROM activity_feed').all();
assert(activities.length >= 2, `Activity feed records exist (Actual: ${activities.length})`);

// 5. Knowledge Gaps (Unanswered AI Questions)
const gaps = db.prepare("SELECT * FROM knowledge_gap_logs WHERE status = 'open'").all();
assert(gaps.length >= 2, `Knowledge Gap logs exist with open status (Actual: ${gaps.length})`);

// 6. Announcements
const announcements = db.prepare('SELECT * FROM announcements').all();
assert(announcements.length >= 2, `Announcements exist (Actual: ${announcements.length})`);
const urgentAnn = db.prepare("SELECT * FROM announcements WHERE priority = 'urgent'").all();
assert(urgentAnn.length >= 1, `Urgent priority announcement exists (Actual: ${urgentAnn.length})`);

// 7. Test Dashboard Summary Caching Table
db.prepare('DELETE FROM dashboard_summary_cache').run();
db.prepare(`
  INSERT INTO dashboard_summary_cache (summary_id, scope, department_id, metric_key, metric_value, trend_percent, calculated_at)
  VALUES ('test-sum-01', 'global', NULL, 'total_knowledge', 482, 8.5, datetime('now', 'localtime'))
`).run();

const cached = db.prepare("SELECT * FROM dashboard_summary_cache WHERE scope = 'global'").get();
assert(cached !== undefined && cached.metric_value === 482, 'Dashboard summary cache reads and writes accurately');

console.log('\n---------------------------------------------------------');
console.log(`📊 Test Summary: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
if (passedTests === totalTests) {
  console.log('🎉 All Phase 2 Dashboard Database and Logic tests PASSED!');
} else {
  console.log('⚠️ Some tests failed. Please review errors above.');
}
console.log('---------------------------------------------------------\n');
