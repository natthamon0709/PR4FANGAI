const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'pr4fang.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = OFF');

console.log('🌱 Seeding PR4Fang AI Database strictly from Master Data (Direct Database Architecture)...');

// Clear existing tables
try { db.prepare('DELETE FROM ai_retrieved_sources').run(); } catch {}
try { db.prepare('DELETE FROM ai_query_logs').run(); } catch {}
try { db.prepare('DELETE FROM line_broadcasts').run(); } catch {}
try { db.prepare('DELETE FROM line_followers').run(); } catch {}
try { db.prepare('DELETE FROM line_account_link_requests').run(); } catch {}
try { db.prepare('DELETE FROM sync_conflicts').run(); } catch {}
try { db.prepare('DELETE FROM sync_logs').run(); } catch {}
try { db.prepare('DELETE FROM sheet_sync_configs').run(); } catch {}
try { db.prepare('DELETE FROM knowledge_attachments').run(); } catch {}
try { db.prepare('DELETE FROM knowledge_version_history').run(); } catch {}
try { db.prepare('DELETE FROM knowledge_items').run(); } catch {}
try { db.prepare('DELETE FROM dashboard_summary_cache').run(); } catch {}
try { db.prepare('DELETE FROM announcements').run(); } catch {}
try { db.prepare('DELETE FROM knowledge_gap_logs').run(); } catch {}
try { db.prepare('DELETE FROM activity_feed').run(); } catch {}
try { db.prepare('DELETE FROM login_audit_logs').run(); } catch {}
try { db.prepare('DELETE FROM reset_password_tokens').run(); } catch {}
try { db.prepare('DELETE FROM master_users').run(); } catch {}
try { db.prepare('DELETE FROM sub_departments').run(); } catch {}
try { db.prepare('DELETE FROM departments').run(); } catch {}
try { db.prepare('DELETE FROM system_settings').run(); } catch {}

db.pragma('foreign_keys = ON');

// 1. Departments (Master_Department)
const departmentsData = [
  { id: 'dept-01-resource', code: 'RES', name: 'ฝ่ายบริหารทรัพยากร' },
  { id: 'dept-02-planning', code: 'PLN', name: 'ฝ่ายแผนงานและความร่วมมือ' },
  { id: 'dept-03-student', code: 'STD', name: 'ฝ่ายพัฒนากิจการนักเรียนนักศึกษา' },
  { id: 'dept-04-academic', code: 'ACD', name: 'ฝ่ายวิชาการ' }
];

const insertDept = db.prepare('INSERT INTO departments (department_id, code, name) VALUES (?, ?, ?)');
departmentsData.forEach(d => insertDept.run(d.id, d.code, d.name));

// 2. Sub-departments (Master_Section)
const subDepartmentsData = [
  { id: 'sub-01-01', deptId: 'dept-01-resource', code: 'RES-GEN', name: 'งานบริหารงานทั่วไป' },
  { id: 'sub-01-02', deptId: 'dept-01-resource', code: 'RES-HR', name: 'งานบริหารและพัฒนาทรัพยากรบุคคล' },
  { id: 'sub-01-03', deptId: 'dept-01-resource', code: 'RES-FIN', name: 'งานการเงิน' },
  { id: 'sub-01-04', deptId: 'dept-01-resource', code: 'RES-ACC', name: 'งานการบัญชี' },
  { id: 'sub-01-05', deptId: 'dept-01-resource', code: 'RES-SUP', name: 'งานพัสดุ' },
  { id: 'sub-01-06', deptId: 'dept-01-resource', code: 'RES-BLD', name: 'งานอาคารสถานที่' },
  { id: 'sub-01-07', deptId: 'dept-01-resource', code: 'RES-VEH', name: 'งานยานพาหนะ' },
  { id: 'sub-01-08', deptId: 'dept-01-resource', code: 'RES-PR', name: 'งานประชาสัมพันธ์' },
  { id: 'sub-02-01', deptId: 'dept-02-planning', code: 'PLN-BGT', name: 'งานวางแผนและงบประมาณ' },
  { id: 'sub-02-02', deptId: 'dept-02-planning', code: 'PLN-DIG', name: 'งานศูนย์ข้อมูลสารสนเทศและดิจิทัล' },
  { id: 'sub-02-03', deptId: 'dept-02-planning', code: 'PLN-COP', name: 'งานความร่วมมือ' },
  { id: 'sub-02-04', deptId: 'dept-02-planning', code: 'PLN-RND', name: 'งานวิจัย พัฒนา นวัตกรรมและสิ่งประดิษฐ์' },
  { id: 'sub-02-05', deptId: 'dept-02-planning', code: 'PLN-QA', name: 'งานประกันคุณภาพและมาตรฐานการศึกษา' },
  { id: 'sub-03-01', deptId: 'dept-03-student', code: 'STD-ACT', name: 'งานกิจกรรมนักเรียนนักศึกษา' },
  { id: 'sub-03-02', deptId: 'dept-03-student', code: 'STD-ADV', name: 'งานครูที่ปรึกษา' },
  { id: 'sub-03-03', deptId: 'dept-03-student', code: 'STD-DIS', name: 'งานปกครองและสวัสดิการนักเรียนนักศึกษา' },
  { id: 'sub-03-04', deptId: 'dept-03-student', code: 'STD-GUD', name: 'งานแนะแนวอาชีพและการมีงานทำ' },
  { id: 'sub-03-05', deptId: 'dept-03-student', code: 'STD-SPJ', name: 'งานโครงการพิเศษและการบริการชุมชน' },
  { id: 'sub-04-01', deptId: 'dept-04-academic', code: 'ACD-CUR', name: 'งานพัฒนาหลักสูตรการเรียนการสอน' },
  { id: 'sub-04-02', deptId: 'dept-04-academic', code: 'ACD-EVA', name: 'งานวัดผลและประเมินผล' },
  { id: 'sub-04-03', deptId: 'dept-04-academic', code: 'ACD-LIB', name: 'งานวิทยบริการและห้องสมุด' },
  { id: 'sub-04-04', deptId: 'dept-04-academic', code: 'ACD-DVE', name: 'งานอาชีวศึกษาระบบทวิภาคี' },
  { id: 'sub-04-05', deptId: 'dept-04-academic', code: 'ACD-REG', name: 'งานทะเบียน' }
];

const insertSubDept = db.prepare('INSERT INTO sub_departments (sub_department_id, department_id, code, name) VALUES (?, ?, ?, ?)');
subDepartmentsData.forEach(s => insertSubDept.run(s.id, s.deptId, s.code, s.name));

// 3. Master Users (EXACTLY 2 USERS from Master_Users sheet)
const adminHash = bcrypt.hashSync('Admin@12345', 12);
const staffHash = bcrypt.hashSync('Fang@2026', 12);

const usersData = [
  {
    id: 'usr-admin-001',
    firstName: 'ผู้ดูแลระบบ',
    lastName: 'ศูนย์ดิจิทัลฯ',
    email: 'admin@fang.ac.th',
    passwordHash: adminHash,
    phone: '053451234',
    deptId: 'dept-02-planning',
    subDeptId: 'sub-02-02',
    role: 'administrator',
    status: 'active',
    lineUserId: 'U1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6'
  },
  {
    id: 'usr-staff-001',
    firstName: 'สมชาย',
    lastName: 'ใจดี',
    email: 'somchai@fang.ac.th',
    passwordHash: staffHash,
    phone: '0898765432',
    deptId: 'dept-01-resource',
    subDeptId: 'sub-01-02',
    role: 'staff',
    status: 'active',
    lineUserId: 'U2233445566778899aabbccddeeff0011'
  }
];

const insertUser = db.prepare(`
  INSERT INTO master_users (
    user_id, first_name, last_name, email, password_hash,
    phone, department_id, sub_department_id, role, status,
    avatar_url, line_user_id, failed_login_count, last_login_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, 0, datetime('now', 'localtime'))
`);

usersData.forEach(u => {
  insertUser.run(u.id, u.firstName, u.lastName, u.email, u.passwordHash, u.phone, u.deptId, u.subDeptId, u.role, u.status, u.lineUserId);
});

console.log(`✅ Seeded ${usersData.length} Master Users directly matching Google Sheet Master_Users!`);

// 3.5 Knowledge Base (Single Source of Truth)
const csvKmPath = path.join(__dirname, '..', 'data', 'google-sheets-export', '04_Knowledge_Base.csv');
if (fs.existsSync(csvKmPath)) {
  function parseCSV(text) {
    const rows = [];
    let currentRow = [];
    let currentVal = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentVal += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentVal.trim());
        currentVal = '';
      } else if ((char === '\r' || char === '\n') && !inQuotes) {
        if (char === '\r' && nextChar === '\n') i++;
        currentRow.push(currentVal.trim());
        if (currentRow.some(c => c.length > 0)) rows.push(currentRow);
        currentRow = [];
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    if (currentRow.length > 0 && currentRow.some(c => c.length > 0)) {
      currentRow.push(currentVal.trim());
      rows.push(currentRow);
    }
    return rows;
  }

  function getDeptId(deptName) {
    if (!deptName) return 'dept-01-resource';
    if (deptName.includes('บริหารทรัพยากร')) return 'dept-01-resource';
    if (deptName.includes('ยุทธศาสตร์') || deptName.includes('แผนงาน')) return 'dept-02-planning';
    if (deptName.includes('กิจการนักเรียน') || deptName.includes('นักศึกษา')) return 'dept-03-student';
    if (deptName.includes('วิชาการ')) return 'dept-04-academic';
    return 'dept-01-resource';
  }

  function getSubDeptId(deptId, subDeptName) {
    const subs = db.prepare('SELECT sub_department_id, name FROM sub_departments WHERE department_id = ?').all(deptId);
    if (subDeptName) {
      const matched = subs.find(s => subDeptName.includes(s.name) || s.name.includes(subDeptName));
      if (matched) return matched.sub_department_id;
    }
    return subs[0] ? subs[0].sub_department_id : 'sub-01-01';
  }

  const rows = parseCSV(fs.readFileSync(csvKmPath, 'utf8')).slice(1);

  const insertKm = db.prepare(`
    INSERT OR REPLACE INTO knowledge_items (
      knowledge_id, content_type, title, summary, content, department_id, sub_department_id,
      tags, status, effective_date, expiry_date, ai_retrieval_enabled, sync_status,
      created_by, updated_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 'synced', 'usr-admin-001', 'usr-admin-001', datetime('now'), datetime('now'))
  `);

  const insertVer = db.prepare(`
    INSERT OR REPLACE INTO knowledge_version_history (
      version_id, knowledge_id, version_no, title_snapshot, summary_snapshot,
      content_snapshot, tags_snapshot, edited_by, edited_at
    ) VALUES (?, ?, 1, ?, ?, ?, ?, 'usr-admin-001', datetime('now'))
  `);

  const insertAtt = db.prepare(`
    INSERT OR REPLACE INTO knowledge_attachments (
      attachment_id, knowledge_id, file_name, file_url, file_type, file_size_kb, uploaded_at
    ) VALUES (?, ?, ?, ?, ?, 256, datetime('now'))
  `);

  rows.forEach(r => {
    const kid = r[0];
    const contentType = r[1] || 'document';
    const title = r[2];
    const summary = r[3];
    const content = r[4];
    const deptId = getDeptId(r[5]);
    const subDeptId = getSubDeptId(deptId, r[6]);
    const tags = r[7] || '[]';
    const status = r[8] || 'published';
    const effDate = r[9] === '-' ? null : r[9];
    const expDate = r[10] === '-' ? null : r[10];
    const driveUrl = r[11];

    insertKm.run(kid, contentType, title, summary, content, deptId, subDeptId, tags, status, effDate, expDate);
    insertVer.run('ver-' + kid + '-1', kid, title, summary, content, tags);
    if (driveUrl && driveUrl !== '-') {
      const isFolder = /drive\/folders\/|\/folders\//i.test(driveUrl);
      if (!isFolder) {
        const isDoc = /document\/d\//i.test(driveUrl);
        const isSheet = /spreadsheets\/d\//i.test(driveUrl);
        const fileExt = isDoc ? 'docx' : isSheet ? 'xlsx' : 'pdf';
        insertAtt.run('att-' + kid + '-1', kid, `${title}.${fileExt}`, driveUrl, fileExt);
      }
    }
  });

  console.log(`✅ Seeded ${rows.length} Knowledge Items into Database!`);
}

// 4. System Settings
const settings = [
  { key: 'site_name', value: 'PR4Fang AI - ระบบจัดการองค์ความรู้' },
  { key: 'college_name', value: 'วิทยาลัยการอาชีพฝาง' },
  { key: 'database_engine', value: 'SQLite 3 (WAL Mode)' },
  { key: 'database_status', value: 'healthy' },
  { key: 'database_storage', value: 'Local Disk / data/pr4fang.db' },
  { key: 'n8n_api_key', value: 'fang_ai_n8n_live_sec_key_2026' }
];

db.exec(`
  DROP TABLE IF EXISTS sheet_sync_configs;
  CREATE TABLE sheet_sync_configs (
    config_id TEXT PRIMARY KEY,
    sheet_name TEXT UNIQUE NOT NULL,
    google_sheet_id TEXT NOT NULL,
    google_tab_gid TEXT NOT NULL,
    target_table TEXT NOT NULL,
    field_mapping TEXT NOT NULL DEFAULT '{}',
    sync_direction TEXT NOT NULL CHECK (sync_direction IN ('db_to_sheet','sheet_to_db','two_way')) DEFAULT 'two_way',
    is_active INTEGER NOT NULL DEFAULT 1,
    last_synced_at TEXT
  );
`);
const insertSetting = db.prepare('INSERT INTO system_settings (key, value) VALUES (?, ?)');
settings.forEach(s => insertSetting.run(s.key, s.value));

// 5. Activity feed & Knowledge gap logs
const insertActivity = db.prepare(`
  INSERT INTO activity_feed (activity_id, actor_user_id, action_type, target_type, target_id, department_id, title_snapshot, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
`);

insertActivity.run('act-001', 'usr-admin-001', 'create', 'knowledge', 'km-0001', 'dept-02-planning', 'คู่มือการเชื่อมต่อ WiFi FANG_STAFF', '-10 minutes');
insertActivity.run('act-002', 'usr-staff-001', 'update', 'knowledge', 'km-0002', 'dept-01-resource', 'ระเบียบการเบิกจ่ายค่าสอนพิเศษ', '-25 minutes');

const insertGap = db.prepare(`
  INSERT INTO knowledge_gap_logs (gap_id, question_text, ask_count, department_guess, status, last_asked_at)
  VALUES (?, ?, ?, ?, ?, datetime('now', ?))
`);

insertGap.run('gap-001', 'ขั้นตอนการขอหนังสือรับรองความประพฤติ', 4, 'dept-03-student', 'open', '-1 hours');
insertGap.run('gap-002', 'แบบฟอร์มขอใช้อาคารสถานที่และห้องประชุม', 3, 'dept-01-resource', 'open', '-2 hours');

// 6. Announcements
const insertAnn = db.prepare(`
  INSERT INTO announcements (announcement_id, title, content, priority, department_id, author_user_id, created_at)
  VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))
`);

insertAnn.run('ann-001', 'แจ้งปิดปรับปรุงระบบเครือข่ายอินเทอร์เน็ตเพื่อพัฒนาระบบ PR4Fang AI', 'งานศูนย์ข้อมูลสารสนเทศและดิจิทัลจะดำเนินการปรับปรุงเซิร์ฟเวอร์หลัก ในวันเสาร์ที่ 10 สิงหาคม 2569 เวลา 20:00 - 24:00 น.', 'urgent', null, 'usr-admin-001', '-1 days');
insertAnn.run('ann-002', 'ขอเชิญบุคลากรทุกฝ่ายเข้าร่วมอบรมการใช้งานระบบ PR4Fang AI และ LINE OA', 'กำหนดการจัดอบรมเชิงปฏิบัติการ วันพุธที่ 15 สิงหาคม 2569 ณ ห้องประชุมเฉลิมพระเกียรติ ชั้น 3 อาคารอำนวยการ', 'normal', null, 'usr-admin-001', '-2 days');

// 7. Login Audit Logs
const insertLog = db.prepare(`
  INSERT INTO login_audit_logs (log_id, user_id, email_attempted, result, ip_address, created_at)
  VALUES (?, ?, ?, ?, ?, datetime('now', ?))
`);

insertLog.run('log-001', 'usr-admin-001', 'admin@fang.ac.th', 'success', '192.168.1.100', '-10 minutes');
insertLog.run('log-002', 'usr-staff-001', 'somchai@fang.ac.th', 'success', '192.168.1.105', '-30 minutes');
insertLog.run('log-003', null, 'unknown@fang.ac.th', 'failed_password', '192.168.1.200', '-2 hours');

// 8. Sheet Sync Configs (Strict 4 Master Tabs from Google Sheet)
const SPREADSHEET_ID = '1-zp32f6bkCcXpGo5O__moHCAXcm_Sjg0rTPRkTK6fYs';

const sheetConfigs = [
  {
    config_id: 'cfg-01-users',
    sheet_name: 'Master_Users',
    google_sheet_id: SPREADSHEET_ID,
    google_tab_gid: '0',
    target_table: 'master_users',
    field_mapping: JSON.stringify({
      'User ID': 'user_id',
      'ชื่อ': 'first_name',
      'นามสกุล': 'last_name',
      'อีเมล': 'email',
      'เบอร์โทรศัพท์': 'phone',
      'รหัสฝ่าย (Department Code)': 'department_id',
      'บทบาท (Role)': 'role',
      'สถานะ (Status)': 'status'
    }),
    sync_direction: 'two_way',
    last_synced_at: new Date(Date.now() - 2 * 60000).toISOString()
  },
  {
    config_id: 'cfg-02-km',
    sheet_name: 'Knowledge_Base',
    google_sheet_id: SPREADSHEET_ID,
    google_tab_gid: '547794364',
    target_table: 'knowledge_items',
    field_mapping: JSON.stringify({
      'หัวข้อเรื่อง': 'title',
      'ประเภทข้อมูล': 'content_type',
      'รายละเอียดข้อมูล': 'content',
      'คำค้น (Keyword)': 'tags',
      'สถานะ': 'status'
    }),
    sync_direction: 'two_way',
    last_synced_at: new Date(Date.now() - 5 * 60000).toISOString()
  },
  {
    config_id: 'cfg-03-dept',
    sheet_name: 'Master_Department',
    google_sheet_id: SPREADSHEET_ID,
    google_tab_gid: '11223344',
    target_table: 'departments',
    field_mapping: JSON.stringify({
      'รหัสฝ่าย (Department ID)': 'department_id',
      'โค้ด (Code)': 'code',
      'ชื่อฝ่าย': 'name'
    }),
    sync_direction: 'two_way',
    last_synced_at: new Date(Date.now() - 10 * 60000).toISOString()
  },
  {
    config_id: 'cfg-04-subdept',
    sheet_name: 'Master_Section',
    google_sheet_id: SPREADSHEET_ID,
    google_tab_gid: '22334455',
    target_table: 'sub_departments',
    field_mapping: JSON.stringify({
      'รหัสงานย่อย (Sub Dept ID)': 'sub_department_id',
      'รหัสฝ่าย (Department ID)': 'department_id',
      'โค้ด (Code)': 'code',
      'ชื่องาน/แผนก': 'name'
    }),
    sync_direction: 'two_way',
    last_synced_at: new Date(Date.now() - 15 * 60000).toISOString()
  }
];

const insertSheetConfig = db.prepare(`
  INSERT INTO sheet_sync_configs (
    config_id, sheet_name, google_sheet_id, google_tab_gid, target_table,
    field_mapping, sync_direction, is_active, last_synced_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
`);

sheetConfigs.forEach(cfg => {
  insertSheetConfig.run(
    cfg.config_id,
    cfg.sheet_name,
    cfg.google_sheet_id,
    cfg.google_tab_gid,
    cfg.target_table,
    cfg.field_mapping,
    cfg.sync_direction,
    cfg.last_synced_at
  );
});

// 9. Sync Logs (Real Sync Logs from initial Google Sheets Import)
const insertSyncLog = db.prepare(`
  INSERT INTO sync_logs (log_id, sheet_name, direction, row_reference, status, error_message, synced_at)
  VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))
`);

insertSyncLog.run('slog-001', 'Knowledge_Base', 'sheet_to_db', 'นำเข้าองค์ความรู้และระเบียบวิทยาลัยจาก Google Sheet 24 รายการ', 'success', null, '-5 minutes');
insertSyncLog.run('slog-002', 'Master_Users', 'sheet_to_db', 'ซิงค์ข้อมูลผู้ใช้งาน Master Users 2 บัญชี', 'success', null, '-2 minutes');

console.log('✅ Seed complete with exactly 4 Master Sheets, 2 Users, and 0 Conflicts!');
