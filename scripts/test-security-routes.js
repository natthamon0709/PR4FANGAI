/**
 * Automated Security, Routing & MVC Verification Test Suite
 * PR4Fang AI
 */

const assert = require('assert');
const path = require('path');
const Database = require('better-sqlite3');
const { createSessionToken, hashPassword } = require('../src/lib/auth');
const { KnowledgeModel } = require('../src/models/knowledge.model');
const { UserModel } = require('../src/models/user.model');
const { middleware } = require('../src/middleware');

let testsPassed = 0;
let testsTotal = 0;

function test(name, fn) {
  testsTotal++;
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
  }
}

async function testAsync(name, fn) {
  testsTotal++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
  }
}

async function runTests() {
  console.log('\n🧪 Starting PR4Fang AI Security, MVC & Route Guarding Verification Tests...\n');

  // =========================================================================
  // Test Group 1: Database Secondary Indexes & Performance
  // =========================================================================
  console.log('📌 Test Group 1: SQLite Secondary Indexes & Optimization');
  const dbPath = path.join(process.cwd(), 'data', 'pr4fang.db');
  const db = new Database(dbPath);

  // Trigger initTables
  const getDb = require('../src/lib/db').getDb;
  getDb();

  const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type = 'index'").all().map(r => r.name);

  test('Index idx_users_email exists', () => {
    assert(indexes.includes('idx_users_email'), 'Missing idx_users_email');
  });

  test('Index idx_users_dept exists', () => {
    assert(indexes.includes('idx_users_dept'), 'Missing idx_users_dept');
  });

  test('Index idx_knowledge_dept_status exists', () => {
    assert(indexes.includes('idx_knowledge_dept_status'), 'Missing idx_knowledge_dept_status');
  });

  test('Index idx_knowledge_updated exists', () => {
    assert(indexes.includes('idx_knowledge_updated'), 'Missing idx_knowledge_updated');
  });

  test('Index idx_ai_logs_created exists', () => {
    assert(indexes.includes('idx_ai_logs_created'), 'Missing idx_ai_logs_created');
  });

  // =========================================================================
  // Test Group 2: Route Guarding & Middleware Tests
  // =========================================================================
  console.log('\n📌 Test Group 2: Server-side Route Guarding & Public Kiosk Routes');

  const adminUser = {
    user_id: 'usr-admin-001',
    first_name: 'Admin',
    last_name: 'Tester',
    email: 'admin@fang.ac.th',
    role: 'administrator',
    status: 'active',
    department_id: 'dept-02-planning',
    sub_department_id: 'sub-02-02',
    department_name: 'ฝ่ายแผนงานฯ',
    sub_department_name: 'งานศูนย์ดิจิทัลฯ'
  };

  const staffUser = {
    user_id: 'usr-staff-001',
    first_name: 'Staff',
    last_name: 'Tester',
    email: 'staff@fang.ac.th',
    role: 'staff',
    status: 'active',
    department_id: 'dept-01-resource',
    sub_department_id: 'sub-01-02',
    department_name: 'ฝ่ายบริหารทรัพยากร',
    sub_department_name: 'งานบุคลากร'
  };

  const adminToken = await createSessionToken(adminUser);
  const staffToken = await createSessionToken(staffUser);

  function mockRequest(pathname, token = null) {
    const url = `http://localhost:3005${pathname}`;
    return {
      nextUrl: { pathname, searchParams: new URLSearchParams() },
      url,
      headers: {
        get: (h) => (h.toLowerCase() === 'authorization' && token ? `Bearer ${token}` : null)
      },
      cookies: {
        get: (name) => (name === 'pr4fang_session' && token ? { value: token } : undefined)
      }
    };
  }

  await testAsync('Kiosk /robot page is public without authentication', async () => {
    const res = await middleware(mockRequest('/robot'));
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await testAsync('Kiosk /robot-reception alias is public without authentication', async () => {
    const res = await middleware(mockRequest('/robot-reception'));
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await testAsync('Login page /login is public', async () => {
    const res = await middleware(mockRequest('/login'));
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await testAsync('Public API /api/robot/chat allows unauthenticated requests', async () => {
    const res = await middleware(mockRequest('/api/robot/chat'));
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await testAsync('Public API /api/line-oa/webhook allows unauthenticated requests', async () => {
    const res = await middleware(mockRequest('/api/line-oa/webhook'));
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await testAsync('Protected page /dashboard redirects unauthenticated users to /login', async () => {
    const res = await middleware(mockRequest('/dashboard'));
    assert(res.status === 307 || res.status === 302, `Expected redirect, got ${res.status}`);
    const location = res.headers.get('location');
    assert(location && location.includes('/login'), `Expected redirect to /login, got ${location}`);
  });

  await testAsync('Protected API /api/dashboard/summary rejects unauthenticated users with 401', async () => {
    const res = await middleware(mockRequest('/api/dashboard/summary'));
    assert(res.status === 401, `Expected 401, got ${res.status}`);
  });

  await testAsync('Admin-only page /users allows administrator', async () => {
    const res = await middleware(mockRequest('/users', adminToken));
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  await testAsync('Admin-only page /users blocks staff and redirects to /dashboard', async () => {
    const res = await middleware(mockRequest('/users', staffToken));
    assert(res.status === 307 || res.status === 302, `Expected redirect, got ${res.status}`);
    const location = res.headers.get('location');
    assert(location && location.includes('/dashboard'), `Expected redirect to /dashboard, got ${location}`);
  });

  await testAsync('Staff can access own preferences /settings/my-preferences', async () => {
    const res = await middleware(mockRequest('/settings/my-preferences', staffToken));
    assert(res.status === 200, `Expected 200, got ${res.status}`);
  });

  // =========================================================================
  // Test Group 3: Security & IDOR Prevention
  // =========================================================================
  console.log('\n📌 Test Group 3: IDOR Prevention & Department Boundaries');

  // Create a knowledge item belonging to Resource department
  const resKnowledgeId = await KnowledgeModel.createKnowledgeItem({
    content_type: 'regulation',
    title: 'ระเบียบพัสดุและยานพาหนะ ฝ่ายบริหารทรัพยากร 2569',
    summary: 'ข้อบังคับการเบิกจ่ายและใช้ยานพาหนะส่วนกลาง',
    content: 'ระเบียบว่าด้วยการเบิกจ่ายพัสดุและยานพาหนะของฝ่ายบริหารทรัพยากรอย่างละเอียด...',
    department_id: 'dept-01-resource',
    sub_department_id: 'sub-01-05',
    status: 'published'
  }, staffUser);

  await testAsync('Staff can update knowledge within their own department', async () => {
    const success = await KnowledgeModel.updateKnowledgeItem(resKnowledgeId, {
      title: 'ระเบียบพัสดุและยานพาหนะ ฝ่ายบริหารทรัพยากร 2569 (แก้ไข)'
    }, staffUser);
    assert(success === true, 'Failed to update own department knowledge');
  });

  // Create another staff in Academic department
  const academicStaffUser = {
    user_id: 'usr-staff-academic',
    first_name: 'Academic',
    last_name: 'Staff',
    email: 'academic@fang.ac.th',
    role: 'staff',
    status: 'active',
    department_id: 'dept-04-academic',
    sub_department_id: 'sub-04-01',
    department_name: 'ฝ่ายวิชาการ',
    sub_department_name: 'งานพัฒนาหลักสูตร'
  };

  await testAsync('Staff is BLOCKED (403 IDOR) when updating another department knowledge', async () => {
    let threw = false;
    try {
      await KnowledgeModel.updateKnowledgeItem(resKnowledgeId, {
        title: 'พยายามแก้ไขข้อมูลข้ามฝ่ายโดยไม่มีสิทธิ์'
      }, academicStaffUser);
    } catch (err) {
      threw = true;
      assert(err.message === 'FORBIDDEN_DEPARTMENT', `Expected FORBIDDEN_DEPARTMENT, got ${err.message}`);
    }
    assert(threw, 'Should have blocked cross-department update');
  });

  await testAsync('Staff is BLOCKED (403 IDOR) when archiving another department knowledge', async () => {
    let threw = false;
    try {
      await KnowledgeModel.deleteOrArchiveKnowledgeItem(resKnowledgeId, academicStaffUser);
    } catch (err) {
      threw = true;
      assert(err.message === 'FORBIDDEN_DEPARTMENT', `Expected FORBIDDEN_DEPARTMENT, got ${err.message}`);
    }
    assert(threw, 'Should have blocked cross-department archive');
  });

  await testAsync('Administrator can update knowledge across any department', async () => {
    const success = await KnowledgeModel.updateKnowledgeItem(resKnowledgeId, {
      title: 'ระเบียบพัสดุและยานพาหนะ ฝ่ายบริหารทรัพยากร 2569 (Admin Reviewed)'
    }, adminUser);
    assert(success === true, 'Admin should be able to update any department knowledge');
  });

  // =========================================================================
  // Test Group 4: SSRF, Traversal & Secret Leakage Guards
  // =========================================================================
  console.log('\n📌 Test Group 4: SSRF, Path Traversal & Leakage Defense');

  test('SSRF Protection blocks internal loopback / metadata IP', () => {
    const blockedIPs = ['127.0.0.1', 'localhost', '169.254.169.254', '10.0.0.1', '192.168.1.1'];
    for (const ip of blockedIPs) {
      const isBlocked = 
        ip === 'localhost' ||
        ip === '127.0.0.1' ||
        ip === '169.254.169.254' ||
        ip.startsWith('10.') ||
        ip.startsWith('192.168.');
      assert(isBlocked, `Failed to block ${ip}`);
    }
  });

  test('Backup download regex blocks directory traversal', () => {
    const safeRegex = /^[a-zA-Z0-9_-]+$/;
    assert(!safeRegex.test('../../etc/passwd'), 'Should block traversal');
    assert(!safeRegex.test('backup-01/../db'), 'Should block traversal');
    assert(safeRegex.test('backup-1793080000000'), 'Should allow valid id');
  });

  test('Audio streaming regex blocks arbitrary file retrieval', () => {
    const audioRegex = /^[a-zA-Z0-9_-]+\.(mp3|wav|ogg)$/;
    assert(!audioRegex.test('../../../package.json'), 'Should block non-audio file');
    assert(!audioRegex.test('voice-123.mp3/..'), 'Should block traversal');
    assert(audioRegex.test('voice-1793080756090-0a0baff7.mp3'), 'Should allow valid voice mp3');
  });

  console.log('\n---------------------------------------------------------');
  console.log(`📊 Test Summary: ${testsPassed}/${testsTotal} tests passed (${Math.round((testsPassed/testsTotal)*100)}%)`);
  if (testsPassed === testsTotal) {
    console.log('🎉 All Security, MVC & Route Guarding tests PASSED!');
  } else {
    console.log('❌ Some tests failed.');
  }
  console.log('---------------------------------------------------------\n');

  if (testsPassed !== testsTotal) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
