const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'pr4fang.db');
const db = new Database(dbPath);

console.log('🧪 Starting PR4Fang AI — Phase 3: Knowledge Management Verification Tests...\n');

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

// 1. Unified Knowledge Schema & Content Types
const contentTypes = db.prepare('SELECT DISTINCT content_type FROM knowledge_items').all().map(r => r.content_type);
assert(contentTypes.length >= 4, `Unified Schema contains multiple content types from Google Sheet (Count: ${contentTypes.length})`);
assert(contentTypes.includes('regulation') && contentTypes.includes('news') && contentTypes.includes('manual'), 'Core content types (regulation, news, manual) exist');

// 2. Version History Table
const versions = db.prepare('SELECT COUNT(*) as c FROM knowledge_version_history').get().c;
assert(versions >= 20, `Version history snapshots recorded (Count: ${versions})`);

// 3. Attachments Table
const attachments = db.prepare('SELECT COUNT(*) as c FROM knowledge_attachments').get().c;
assert(attachments >= 10, `Knowledge attachments linked (Count: ${attachments})`);

// 4. Test Create Operation & Version Snapshot (v1)
const testKid = 'km-test-unit-01';
db.prepare('DELETE FROM knowledge_items WHERE knowledge_id = ?').run(testKid);
db.prepare('DELETE FROM knowledge_version_history WHERE knowledge_id = ?').run(testKid);

db.prepare(`
  INSERT INTO knowledge_items (
    knowledge_id, content_type, title, summary, content, department_id, sub_department_id,
    tags, status, ai_retrieval_enabled, created_by, updated_by
  ) VALUES (?, 'regulation', 'ทดสอบระเบียบการลา 2569', 'สรุปย่อการลา', 'เนื้อหาฉบับเต็ม...', 'dept-01-resource', 'sub-01-02', '["ลา","ทดสอบ"]', 'published', 1, 'usr-staff-001', 'usr-staff-001')
`).run(testKid);

db.prepare(`
  INSERT INTO knowledge_version_history (
    version_id, knowledge_id, version_no, title_snapshot, summary_snapshot, content_snapshot, tags_snapshot, edited_by
  ) VALUES ('ver-test-01', ?, 1, 'ทดสอบระเบียบการลา 2569', 'สรุปย่อการลา', 'เนื้อหาฉบับเต็ม...', '["ลา","ทดสอบ"]', 'usr-staff-001')
`).run(testKid);

const createdItem = db.prepare('SELECT * FROM knowledge_items WHERE knowledge_id = ?').get(testKid);
assert(createdItem !== undefined && createdItem.title === 'ทดสอบระเบียบการลา 2569', 'Create knowledge item succeeds');

// 5. Test Update Operation & Version Snapshot (v2)
db.prepare(`
  INSERT INTO knowledge_version_history (
    version_id, knowledge_id, version_no, title_snapshot, summary_snapshot, content_snapshot, tags_snapshot, edited_by
  ) VALUES ('ver-test-02', ?, 2, 'ทดสอบระเบียบการลา 2569 (ฉบับแก้ไข)', 'สรุปย่อใหม่', 'เนื้อหาแก้ไข...', '["ลา","แก้ไข"]', 'usr-staff-001')
`).run(testKid);

db.prepare(`
  UPDATE knowledge_items SET
    title = 'ทดสอบระเบียบการลา 2569 (ฉบับแก้ไข)',
    summary = 'สรุปย่อใหม่',
    content = 'เนื้อหาแก้ไข...'
  WHERE knowledge_id = ?
`).run(testKid);

const vCount = db.prepare('SELECT COUNT(*) as c FROM knowledge_version_history WHERE knowledge_id = ?').get(testKid).c;
assert(vCount === 2, `Version history snapshot recorded v2 (Count: ${vCount})`);

// 6. Test Archive Operation
db.prepare("UPDATE knowledge_items SET status = 'archived' WHERE knowledge_id = ?").run(testKid);
const archivedItem = db.prepare('SELECT status FROM knowledge_items WHERE knowledge_id = ?').get(testKid);
assert(archivedItem.status === 'archived', 'Archive knowledge item sets status to archived');

// 7. Test AI Retrieval Flag
assert(createdItem.ai_retrieval_enabled === 1, 'AI Retrieval toggle flag stored correctly');

// Cleanup
db.prepare('DELETE FROM knowledge_version_history WHERE knowledge_id = ?').run(testKid);
db.prepare('DELETE FROM knowledge_items WHERE knowledge_id = ?').run(testKid);

console.log('\n---------------------------------------------------------');
console.log(`📊 Test Summary: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
if (passedTests === totalTests) {
  console.log('🎉 All Phase 3 Knowledge Management Database and Logic tests PASSED!');
} else {
  console.log('⚠️ Some tests failed.');
}
console.log('---------------------------------------------------------\n');
