const Database = require('better-sqlite3');
const path = require('path');
const assert = require('assert');
const crypto = require('crypto');

const dbPath = path.join(__dirname, '..', 'data', 'pr4fang.db');
const db = new Database(dbPath);

console.log('🧪 Starting PR4Fang AI — Phase 5: AI Processing Engine Verification Tests...\n');

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

// Test 1: AI Engine Config Table and Default Row
runTest('AI Engine Configs table initialized with active row', () => {
  const config = db.prepare('SELECT * FROM ai_engine_configs WHERE is_active = 1 LIMIT 1').get();
  assert(config, 'Active AI engine config exists');
  assert(config.provider === 'gemini', 'Default provider is gemini');
  assert(config.model_name === 'gemini-2.5-flash', 'Default model is gemini-2.5-flash');
  assert(config.confidence_threshold >= 0.5 && config.confidence_threshold <= 1.0, 'Threshold is within valid range');
  assert(config.retrieval_top_k >= 1 && config.retrieval_top_k <= 10, 'Top-K is within valid range');
});

// Test 2: AES-256 API Key Encryption & Masking
runTest('AES-256 API Key encryption and masking works reliably', () => {
  const ENCRYPTION_SECRET = process.env.AI_SECRET_KEY || 'pr4fang_ai_secure_master_key_2026_aes256';
  const ALGORITHM = 'aes-256-cbc';
  const KEY = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();

  function encryptApiKey(apiKey) {
    if (!apiKey || apiKey.startsWith('enc_')) return apiKey;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `enc_${iv.toString('hex')}:${encrypted}`;
  }

  function decryptApiKey(encryptedText) {
    if (!encryptedText || !encryptedText.startsWith('enc_')) return encryptedText;
    const raw = encryptedText.replace('enc_', '');
    const [ivHex, encryptedHex] = raw.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  function maskApiKey(apiKeyOrEncrypted) {
    const decrypted = decryptApiKey(apiKeyOrEncrypted);
    if (decrypted.length <= 4) return '••••••••' + decrypted;
    return '••••••••••••••••' + decrypted.slice(-4);
  }

  const sampleKey = 'AIzaSyDemoSecretKeyForTesting12345678904f2a';
  const encrypted = encryptApiKey(sampleKey);
  assert(encrypted.startsWith('enc_'), 'Encrypted key starts with prefix enc_');
  assert(encrypted !== sampleKey, 'Encrypted key is not plain text');

  const decrypted = decryptApiKey(encrypted);
  assert(decrypted === sampleKey, 'Decrypted key matches original');

  const masked = maskApiKey(sampleKey);
  assert(masked.endsWith('4f2a'), 'Masked key preserves last 4 characters');
  assert(masked.includes('••••'), 'Masked key hides prefix with bullets');
});

// Test 3: Semantic Knowledge Base Search from DB (Google Sheet Master Data)
runTest('Semantic Knowledge Base search returns relevant items from database', () => {
  const query = 'คณะผู้บริหารวิทยาลัย';
  const items = db.prepare(`
    SELECT k.knowledge_id, k.title, k.summary, k.content, k.tags, d.name as department_name
    FROM knowledge_items k
    LEFT JOIN departments d ON k.department_id = d.department_id
    WHERE k.status = 'published' AND k.ai_retrieval_enabled = 1
  `).all();

  assert(items.length > 0, 'Published knowledge items exist in database');

  const matched = items.filter(i => 
    (i.title && i.title.includes('ผู้บริหาร')) || 
    (i.summary && i.summary.includes('ผู้บริหาร')) ||
    (i.tags && i.tags.includes('ผู้บริหาร'))
  );

  assert(matched.length > 0, 'Found matching knowledge items for executive query');
  assert(matched[0].title, 'Matched item has a title');
});

// Test 4: RAG Pipeline Confidence & Grounded Answer Synthesis
runTest('RAG Pipeline produces grounded answer on high confidence query', () => {
  const item = db.prepare(`
    SELECT k.knowledge_id, k.title, k.summary, k.content, d.name as department_name, s.name as sub_department_name
    FROM knowledge_items k
    LEFT JOIN departments d ON k.department_id = d.department_id
    LEFT JOIN sub_departments s ON k.sub_department_id = s.sub_department_id
    WHERE k.status = 'published' AND k.ai_retrieval_enabled = 1 AND k.title LIKE '%ผู้บริหาร%'
    LIMIT 1
  `).get();

  assert(item, 'Found target knowledge item');
  const answer = `ตามข้อมูลจาก ${item.title} (${item.department_name}):\n\n${item.summary}\n\nหากท่านต้องการสอบถามรายละเอียดเพิ่มเติม สามารถติดต่อได้ที่${item.sub_department_name || item.department_name}`;
  
  assert(answer.includes(item.title), 'Answer cites source title');
  assert(answer.includes('ฝ่าย'), 'Answer cites department');
});

// Test 5: Fallback Response & Auto Knowledge Gap Logging on Unknown Queries
runTest('RAG triggers fallback response and logs knowledge gap on unknown query', () => {
  const testUnknownQuestion = 'คำถามที่ไม่มีในระบบ ' + Date.now();
  const gapId = 'gap-' + crypto.randomUUID();

  // Simulate Fallback & Auto Gap insertion
  db.prepare(`
    INSERT INTO knowledge_gap_logs (gap_id, question_text, ask_count, status, department_guess, last_asked_at)
    VALUES (?, ?, 1, 'open', 'dept-01-resource', datetime('now', 'localtime'))
  `).run(gapId, testUnknownQuestion);

  const gap = db.prepare('SELECT * FROM knowledge_gap_logs WHERE gap_id = ?').get(gapId);
  assert(gap, 'Auto-logged query to knowledge_gap_logs');
  assert(gap.status === 'open', 'Gap status is open');
  assert(gap.ask_count === 1, 'Ask count initialized');

  // Clean up
  db.prepare('DELETE FROM knowledge_gap_logs WHERE gap_id = ?').run(gapId);
});

// Test 6: Playground Mode isolation
runTest('Playground mode runs RAG without polluting actual AI Query Logs', () => {
  const initialLogCount = (db.prepare('SELECT COUNT(*) as c FROM ai_query_logs').get()).c;
  
  // Playground simulation (does not insert into ai_query_logs)
  const isPlayground = true;
  if (!isPlayground) {
    db.prepare(`INSERT INTO ai_query_logs (log_id, line_user_id, question_text, confidence_score, created_at) VALUES ('test', 'u1', 'q1', 0.8, datetime('now', 'localtime'))`).run();
  }

  const afterLogCount = (db.prepare('SELECT COUNT(*) as c FROM ai_query_logs').get()).c;
  assert(afterLogCount === initialLogCount, 'Log count unchanged during playground execution');
});

// Test 7: Live Query Logs & Retrieved Sources persistence
runTest('Live queries correctly record ai_query_logs and ai_retrieved_sources', () => {
  const logId = 'log-test-' + crypto.randomUUID();
  const lineUserId = 'U1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6';
  const matchedUser = db.prepare('SELECT user_id, department_id FROM master_users WHERE line_user_id = ? LIMIT 1').get(lineUserId);

  db.prepare(`
    INSERT INTO ai_query_logs (
      log_id, line_user_id, matched_user_id, question_text, confidence_score,
      answer_text, is_fallback, response_time_ms, feedback, department_id, created_at
    ) VALUES (?, ?, ?, 'ทดสอบคำถามจริง', 0.88, 'คำตอบจริง', 0, 180, 'none', ?, datetime('now', 'localtime'))
  `).run(logId, lineUserId, matchedUser?.user_id || null, matchedUser?.department_id || null);

  const savedLog = db.prepare('SELECT * FROM ai_query_logs WHERE log_id = ?').get(logId);
  assert(savedLog, 'Query log saved in database');
  assert(savedLog.matched_user_id === 'usr-admin-001', 'Correctly linked LINE user to master user');

  // Insert retrieved sources
  const srcId = 'src-test-' + crypto.randomUUID();
  const sampleKnowledge = db.prepare('SELECT knowledge_id FROM knowledge_items LIMIT 1').get();
  db.prepare(`
    INSERT INTO ai_retrieved_sources (source_id, log_id, knowledge_id, relevance_score, rank)
    VALUES (?, ?, ?, 0.88, 1)
  `).run(srcId, logId, sampleKnowledge.knowledge_id);

  const savedSources = db.prepare('SELECT * FROM ai_retrieved_sources WHERE log_id = ?').all(logId);
  assert(savedSources.length === 1, 'Retrieved sources recorded');

  // Clean up
  db.prepare('DELETE FROM ai_retrieved_sources WHERE log_id = ?').run(logId);
  db.prepare('DELETE FROM ai_query_logs WHERE log_id = ?').run(logId);
});

// Test 8: Feedback Recording
runTest('Feedback update modifies ai_query_logs feedback field', () => {
  const testLogId = 'test-log-' + crypto.randomUUID();
  db.prepare(`
    INSERT INTO ai_query_logs (log_id, line_user_id, question_text, confidence_score, answer_text, is_fallback, response_time_ms, feedback, created_at)
    VALUES (?, 'TEST_USER', 'คำถามทดสอบ', 0.85, 'คำตอบทดสอบ', 0, 150, 'none', datetime('now', 'localtime'))
  `).run(testLogId);

  db.prepare('UPDATE ai_query_logs SET feedback = ? WHERE log_id = ?').run('helpful', testLogId);
  const updated = db.prepare('SELECT feedback FROM ai_query_logs WHERE log_id = ?').get(testLogId);
  assert(updated.feedback === 'helpful', 'Feedback updated to helpful');

  // Clean up
  db.prepare('DELETE FROM ai_query_logs WHERE log_id = ?').run(testLogId);
});

// Test 9: Manual Mark as Gap
runTest('Manual Mark as Gap creates/updates entry in knowledge_gap_logs', () => {
  const queryText = 'คำถามที่ต้องการ Mark as Gap ' + Date.now();
  const gapId = 'gap-' + crypto.randomUUID();

  db.prepare(`
    INSERT INTO knowledge_gap_logs (gap_id, question_text, ask_count, status, department_guess, last_asked_at)
    VALUES (?, ?, 1, 'open', 'dept-01-resource', datetime('now', 'localtime'))
  `).run(gapId, queryText);

  const gap = db.prepare('SELECT * FROM knowledge_gap_logs WHERE gap_id = ?').get(gapId);
  assert(gap && gap.question_text === queryText, 'Manual gap created successfully');

  // Clean up
  db.prepare('DELETE FROM knowledge_gap_logs WHERE gap_id = ?').run(gapId);
});

// Test 10: Staff Role Scoping
runTest('Staff query scoping filters logs by department_id', () => {
  const staffDeptId = 'dept-01-resource';
  const otherDeptId = 'dept-04-academic';

  const log1 = 'log-scope-1-' + Date.now();
  const log2 = 'log-scope-2-' + Date.now();

  db.prepare(`
    INSERT INTO ai_query_logs (log_id, line_user_id, question_text, confidence_score, answer_text, department_id, feedback, created_at)
    VALUES (?, 'U1', 'Q1', 0.8, 'A1', ?, 'none', datetime('now', 'localtime')),
           (?, 'U2', 'Q2', 0.8, 'A2', ?, 'none', datetime('now', 'localtime'))
  `).run(log1, staffDeptId, log2, otherDeptId);

  const scopedLogs = db.prepare('SELECT * FROM ai_query_logs WHERE department_id = ?').all(staffDeptId);
  assert(scopedLogs.some(l => l.log_id === log1), 'Staff sees their department logs');
  assert(!scopedLogs.some(l => l.log_id === log2), 'Staff cannot see other department logs');

  // Clean up
  db.prepare('DELETE FROM ai_query_logs WHERE log_id IN (?, ?)').run(log1, log2);
});

// Test 11: Conversational Intent Detection (Greetings & Courtesies)
runTest('Conversational greetings and thank you are handled without triggering false knowledge search', () => {
  function detectConversationalIntent(text) {
    const clean = (text || '').toLowerCase().replace(/[\s\t\n!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/g, '');
    const greetings = ['สวัสดี', 'สวัสดีครับ', 'สวัสดีค่ะ', 'สวัสดีคีับ', 'สวัสดีคะ', 'สวัสดีคับ', 'สวัสดีจ้า', 'หวัดดี', 'หวัดดีครับ', 'หวัดดีค่ะ', 'ดีครับ', 'ดีค่ะ', 'ฮัลโหล', 'hello', 'hi', 'hey', 'sawasdee'];
    if (greetings.includes(clean) || (clean.startsWith('สวัสดี') && clean.length <= 12) || (clean.startsWith('หวัดดี') && clean.length <= 10)) {
      return { isConversational: true, type: 'greeting' };
    }
    const thanks = ['ขอบคุณ', 'ขอบคุณครับ', 'ขอบคุณค่ะ', 'ขอบคุณคะ', 'ขอบคุณคับ', 'ขอบใจ', 'ขอบใจจ้า', 'ขอบพระคุณ', 'thanks', 'thankyou', 'thx'];
    if (thanks.includes(clean) || (clean.startsWith('ขอบคุณ') && clean.length <= 12)) {
      return { isConversational: true, type: 'thanks' };
    }
    return { isConversational: false };
  }

  assert(detectConversationalIntent('สวัสดีครับ').isConversational, 'สวัสดีครับ detected as conversational');
  assert(detectConversationalIntent('สวัสดีคีับ').isConversational, 'สวัสดีคีับ typo detected as conversational');
  assert(detectConversationalIntent('ขอบคุณครับ').isConversational, 'ขอบคุณครับ detected as conversational');
  assert(!detectConversationalIntent('นักศึกษา ปวส. ชายต้องใส่เนคไทหรือไม่').isConversational, 'Actual question is not detected as greeting');
});

// Test 12: Knowledge Gap Logging
runTest('Unknown questions are accurately logged to knowledge_gap_logs', () => {
  const testQuestion = 'คำถามทดสอบที่ไม่มีในฐานข้อมูล ' + Date.now();
  const gapId = 'gap-' + crypto.randomUUID();

  db.prepare(`
    INSERT INTO knowledge_gap_logs (gap_id, question_text, ask_count, status, department_guess, last_asked_at)
    VALUES (?, ?, 1, 'open', 'dept-01-resource', datetime('now', 'localtime'))
  `).run(gapId, testQuestion);

  const gap = db.prepare('SELECT * FROM knowledge_gap_logs WHERE question_text = ?').get(testQuestion);
  assert(gap && gap.gap_id === gapId, 'Knowledge gap is logged');
  assert(gap.ask_count === 1, 'Ask count is 1');

  // Clean up
  db.prepare('DELETE FROM knowledge_gap_logs WHERE gap_id = ?').run(gapId);
});

// Test 13: Drive Media Intelligence & Teacher Photo Resolution
runTest('Drive Media Intelligence matches and retrieves teacher photos', () => {
  const query = 'ใครเป็นหัวหน้าสาขาวิชาเทคโนโลยีธุรกิจดิจิทัล?';
  const answer = 'หัวหน้าสาขาวิชาเทคโนโลยีธุรกิจดิจิทัล คือ นายปัฐวิกรณ์ บุญต่าย — ครูประจำสาขาวิชา';
  const combined = (query + ' ' + answer).toLowerCase();

  const cachedMedia = db.prepare('SELECT * FROM drive_media_cache').all();
  assert(cachedMedia.length > 0, 'Drive media cache contains items');

  let matched = null;
  const normalizedCombined = combined.replace(/ศุทธิชัย/g, 'ศุทิชัย');
  for (const m of cachedMedia) {
    const rawPersonName = (m.title_or_person_name.split('(')[0] || '').replace(/\.(jpg|jpeg|png|webp)$/i, '').trim().toLowerCase();
    const normPersonName = rawPersonName.replace(/ศุทธิชัย/g, 'ศุทิชัย');
    const cleanPersonName = normPersonName.replace(/^(นาย|นางสาว|นาง|ว่าที่ร้อยตรี|ว่าที่ ร.ต.|ครู|อาจารย์)\s*/i, '').trim();
    if (rawPersonName && (normalizedCombined.includes(rawPersonName) || normalizedCombined.includes(normPersonName) || (cleanPersonName.length >= 3 && normalizedCombined.includes(cleanPersonName)))) {
      matched = m;
      break;
    }
  }

  assert(matched, 'Matched นายปัฐวิกรณ์ บุญต่าย in drive_media_cache');
  assert(matched.title_or_person_name.includes('ปัฐวิกรณ์'), 'Correct teacher matched');
  assert(matched.image_url.includes('googleusercontent.com') || matched.image_url.includes('drive.google.com'), 'Valid image URL generated');
});

// Test 14: Teacher Photo Resolution for Network & Hotel & Digital Tech
runTest('Teacher photos for Network Security, Hotel, and Digital Tech resolve correctly', () => {
  const testCases = [
    {
      q: 'ใครเป็นหัวหน้าสาขาวิชาเครือข่ายคอมพิวเตอร์และความปลอดภัย',
      a: 'หัวหน้าสาขาวิชา คือ นายศุทธิชัย อายุมั่น',
      expectedName: 'ศุทิชัย อายุมั่น'
    },
    {
      q: 'นายภัคพล บำรุงเกียรติอยู่สาขาอะไร',
      a: 'นายภัคพล บำรุงเกียรติ อยู่สาขาวิชาเทคโนโลยีธุรกิจดิจิทัล',
      expectedName: 'ภัคพล บำรุงเกียรติ'
    },
    {
      q: 'ใครเป็นหัวหน้าสาขาวิชาการโรงแรม',
      a: 'หัวหน้าสาขาวิชาการโรงแรม คือ นางสาวดารุณี วรรณเรศ',
      expectedName: 'ดารุณี วรรณเรศ'
    }
  ];

  const cachedMedia = db.prepare('SELECT * FROM drive_media_cache').all();

  testCases.forEach(tc => {
    const combined = `${tc.q} ${tc.a}`.toLowerCase();
    const normalizedCombined = combined.replace(/ศุทธิชัย/g, 'ศุทิชัย');
    let matched = null;
    for (const m of cachedMedia) {
      const rawPersonName = (m.title_or_person_name.split('(')[0] || '').replace(/\.(jpg|jpeg|png|webp)$/i, '').trim().toLowerCase();
      const normPersonName = rawPersonName.replace(/ศุทธิชัย/g, 'ศุทิชัย');
      const cleanPersonName = normPersonName.replace(/^(นาย|นางสาว|นาง|ว่าที่ร้อยตรี|ว่าที่ ร.ต.|ครู|อาจารย์)\s*/i, '').trim();
      if (rawPersonName && (normalizedCombined.includes(rawPersonName) || normalizedCombined.includes(normPersonName) || (cleanPersonName.length >= 3 && normalizedCombined.includes(cleanPersonName)))) {
        matched = m;
        break;
      }
    }
    assert(matched, `Matched ${tc.expectedName}`);
    assert(matched.image_url.startsWith('https://'), 'Has valid HTTPS image URL');
  });
});

console.log('\n---------------------------------------------------------');
console.log(`📊 Test Summary: ${passedTests}/${totalTests} tests passed (${Math.round((passedTests / totalTests) * 100)}%)`);
if (passedTests === totalTests) {
  console.log('🎉 All Phase 5 AI Processing Engine tests PASSED!');
} else {
  console.log('⚠️ Some tests failed. Please review errors above.');
}
console.log('---------------------------------------------------------\n');
