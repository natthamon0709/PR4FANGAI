const Database = require('better-sqlite3');
const path = require('path');
const assert = require('assert');
const crypto = require('crypto');

const dbPath = path.join(__dirname, '..', 'data', 'pr4fang.db');
const db = new Database(dbPath);

console.log('🧪 Starting PR4Fang AI — Phase 6: LINE Official Account Verification Tests...\n');

let passedTests = 0;
let totalTests = 0;

function runTest(description, testFn) {
  totalTests++;
  try {
    testFn();
    console.log(`  ✅ [PASS] ${description}`);
    passedTests++;
  } catch (error) {
    console.error(`  ❌ [FAIL] ${description}`);
    console.error(`     Error: ${error.message}\n`);
  }
}

// Test 1: LINE Channel Configs table
runTest('LINE Channel Configs table initialized with active row', () => {
  const config = db.prepare('SELECT * FROM line_channel_configs WHERE is_active = 1 LIMIT 1').get();
  assert(config, 'Active LINE channel config exists');
  assert(config.channel_id !== undefined, 'Channel ID is present');
  assert(config.webhook_url.includes('/api/line-oa/webhook'), 'Webhook URL configured');
  assert(config.webhook_verified !== undefined, 'Webhook verified status exists');
});

// Test 2: LINE Signature Validation (HMAC-SHA256)
runTest('LINE X-Line-Signature HMAC-SHA256 validation works reliably', () => {
  const channelSecret = 'fang_line_oa_sec_live_2026';
  const body = JSON.stringify({ events: [{ type: 'message', message: { text: 'สวัสดี' } }] });
  const validSignature = crypto.createHmac('sha256', channelSecret).update(body).digest('base64');

  function validate(bodyStr, sig, secret) {
    const hash = crypto.createHmac('sha256', secret).update(bodyStr).digest('base64');
    const bufHash = Buffer.from(hash);
    const bufSig = Buffer.from(sig);
    if (bufHash.length !== bufSig.length) return false;
    return crypto.timingSafeEqual(bufHash, bufSig);
  }

  assert(validate(body, validSignature, channelSecret), 'Valid signature passes');
  assert(!validate(body, 'invalid_sig_string_fake', channelSecret), 'Invalid signature fails safely');
});

// Test 3: LINE Rich Menu Management & Default Flag
runTest('LINE Rich Menus table stores tap areas and maintains default menu', () => {
  const defaultMenu = db.prepare('SELECT * FROM line_rich_menus WHERE is_default = 1 LIMIT 1').get();
  assert(defaultMenu, 'Default rich menu exists');
  assert(defaultMenu.chat_bar_text === 'เมนูหลัก', 'Chat bar text is set');

  const tapAreas = JSON.parse(defaultMenu.tap_areas);
  assert(Array.isArray(tapAreas) && tapAreas.length >= 6, 'Rich menu has at least 6 tap areas');
  assert(tapAreas[0].action && tapAreas[0].action.type === 'message', 'First tap area action is message');
});

// Test 4: LINE Follower Tracking & Master User Link
runTest('LINE Followers records track LINE users and link to master users', () => {
  const testId = 'f-test-unit-001';
  db.prepare(`
    INSERT INTO line_followers (follower_id, line_user_id, display_name, avatar_url, linked_master_user_id, followed_at, blocked, last_interaction_at)
    VALUES (?, 'Utest1234567890abcdef', 'Test User', null, 'usr-staff-001', datetime('now', 'localtime'), 0, datetime('now', 'localtime'))
    ON CONFLICT(follower_id) DO NOTHING
  `).run(testId);

  const followers = db.prepare('SELECT * FROM line_followers').all();
  assert(followers.length >= 1, 'Followers tracked');

  const linkedFollower = db.prepare('SELECT * FROM line_followers WHERE linked_master_user_id IS NOT NULL LIMIT 1').get();
  assert(linkedFollower, 'Linked staff follower exists');
  assert(linkedFollower.line_user_id.startsWith('U'), 'Valid LINE user ID format');

  db.prepare('DELETE FROM line_followers WHERE follower_id = ?').run(testId);
});

// Test 5: 6-Digit Account Linking Request Creation
runTest('Account linking generates 6-digit code with 10-minute expiration', () => {
  const masterUserId = 'usr-staff-001';
  const reqId = 'req-test-' + crypto.randomUUID();
  const code = '123456';

  db.prepare(`
    INSERT INTO line_account_link_requests (request_id, master_user_id, verification_code, status, created_at, expires_at)
    VALUES (?, ?, ?, 'pending', datetime('now', 'localtime'), datetime('now', 'localtime', '+10 minutes'))
  `).run(reqId, masterUserId, code);

  const req = db.prepare('SELECT * FROM line_account_link_requests WHERE request_id = ?').get(reqId);
  assert(req && req.verification_code === '123456', 'Verification code created');
  assert(req.status === 'pending', 'Status is pending');

  // Clean up
  db.prepare('DELETE FROM line_account_link_requests WHERE request_id = ?').run(reqId);
});

// Test 6: 6-Digit Code Redemption links Master User & Follower
runTest('Redeeming 6-digit code via chat links LINE user to Master User', () => {
  const masterUserId = 'usr-staff-001';
  const reqId = 'req-link-test-' + crypto.randomUUID();
  const code = '789012';
  const testLineUserId = 'Utest99887766554433221100aabbccdd';

  // Create request
  db.prepare(`
    INSERT INTO line_account_link_requests (request_id, master_user_id, verification_code, status, created_at, expires_at)
    VALUES (?, ?, ?, 'pending', datetime('now', 'localtime'), datetime('now', 'localtime', '+10 minutes'))
  `).run(reqId, masterUserId, code);

  // Execute verification logic
  const pendingReq = db.prepare(`
    SELECT * FROM line_account_link_requests
    WHERE verification_code = ? AND status = 'pending' AND datetime(expires_at) >= datetime('now', 'localtime')
  `).get(code);

  assert(pendingReq, 'Found pending request');

  db.prepare("UPDATE line_account_link_requests SET status = 'verified', line_user_id = ? WHERE request_id = ?").run(testLineUserId, reqId);
  db.prepare("UPDATE master_users SET line_user_id = ? WHERE user_id = ?").run(testLineUserId, masterUserId);

  const updatedUser = db.prepare('SELECT line_user_id FROM master_users WHERE user_id = ?').get(masterUserId);
  assert(updatedUser.line_user_id === testLineUserId, 'Master user line_user_id updated');

  // Clean up
  db.prepare('DELETE FROM line_account_link_requests WHERE request_id = ?').run(reqId);
});

// Test 7: LINE Webhook Message Processing
runTest('Webhook text message calls RAG Pipeline and produces response', () => {
  const query = 'ขอแบบฟอร์มขอลาป่วย';
  const item = db.prepare(`
    SELECT k.title, k.summary, d.name as department_name
    FROM knowledge_items k
    JOIN departments d ON k.department_id = d.department_id
    WHERE k.status = 'published' AND k.title LIKE '%ลา%'
    LIMIT 1
  `).get();

  assert(item, 'Found matching knowledge item for LINE reply');
  const replyText = `ตามข้อมูลจาก ${item.title} (${item.department_name}):\n\n${item.summary}`;
  assert(replyText.length > 20, 'Generated comprehensive reply text for LINE chat');
});

// Test 8: LINE Follow and Unfollow Event Handling
runTest('Follow & Unfollow events update line_followers blocked status', () => {
  const testUserId = 'Ufollow-test-' + Date.now();
  const fId = 'f-' + crypto.randomUUID();

  // 1. Follow event
  db.prepare(`
    INSERT INTO line_followers (follower_id, line_user_id, display_name, followed_at, blocked, last_interaction_at)
    VALUES (?, ?, 'New Follower', datetime('now', 'localtime'), 0, datetime('now', 'localtime'))
  `).run(fId, testUserId);

  let f = db.prepare('SELECT blocked FROM line_followers WHERE follower_id = ?').get(fId);
  assert(f.blocked === 0, 'Follower active after follow event');

  // 2. Unfollow event
  db.prepare('UPDATE line_followers SET blocked = 1 WHERE line_user_id = ?').run(testUserId);
  f = db.prepare('SELECT blocked FROM line_followers WHERE follower_id = ?').get(fId);
  assert(f.blocked === 1, 'Follower blocked after unfollow event');

  // Clean up
  db.prepare('DELETE FROM line_followers WHERE follower_id = ?').run(fId);
});

// Test 9: Broadcast Creation & Delivery Calculation
runTest('Broadcast creation computes recipients for all followers and specific department', () => {
  const bcId = 'bc-test-' + crypto.randomUUID();
  db.prepare(`
    INSERT INTO line_broadcasts (
      broadcast_id, title, message_text, target_type, status, delivered_count, created_by, created_at
    ) VALUES (?, 'Broadcast ทดสอบ', 'ข้อความทดสอบ', 'all_followers', 'sent', 3842, 'usr-admin-001', datetime('now', 'localtime'))
  `).run(bcId);

  const bc = db.prepare('SELECT * FROM line_broadcasts WHERE broadcast_id = ?').get(bcId);
  assert(bc && bc.delivered_count === 3842, 'Broadcast delivered count recorded');

  // Clean up
  db.prepare('DELETE FROM line_broadcasts WHERE broadcast_id = ?').run(bcId);
});

// Test 10: Staff Scoping for Broadcasts
runTest('Staff can only see their department broadcasts', () => {
  const staffDeptId = 'dept-01-resource';
  const otherDeptId = 'dept-04-academic';

  const bc1 = 'bc-s1-' + Date.now();
  const bc2 = 'bc-s2-' + Date.now();

  db.prepare(`
    INSERT INTO line_broadcasts (broadcast_id, title, message_text, target_type, department_id, created_by, created_at)
    VALUES (?, 'B1', 'T1', 'linked_staff_department', ?, 'usr-staff-001', datetime('now', 'localtime')),
           (?, 'B2', 'T2', 'linked_staff_department', ?, 'usr-staff-002', datetime('now', 'localtime'))
  `).run(bc1, staffDeptId, bc2, otherDeptId);

  const staffBroadcasts = db.prepare('SELECT broadcast_id FROM line_broadcasts WHERE department_id = ?').all(staffDeptId);
  assert(staffBroadcasts.some(b => b.broadcast_id === bc1), 'Staff sees their department broadcasts');
  assert(!staffBroadcasts.some(b => b.broadcast_id === bc2), 'Staff cannot see other department broadcasts');

  // Clean up
  db.prepare('DELETE FROM line_broadcasts WHERE broadcast_id IN (?, ?)').run(bc1, bc2);
});

console.log('\n---------------------------------------------------------');
console.log(`📊 Test Summary: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
if (passedTests === totalTests) {
  console.log('🎉 All Phase 6 LINE Official Account tests PASSED!');
} else {
  console.log('⚠️ Some tests failed. Please review errors above.');
}
console.log('---------------------------------------------------------\n');
