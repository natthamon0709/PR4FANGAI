const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, '..', 'data', 'pr4fang.db');
const db = new Database(dbPath);
const outDir = path.join(__dirname, '..', 'data', 'google-sheets-export');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function writeCSV(filename, headers, rows) {
  const escapeVal = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const content = [
    headers.map(escapeVal).join(','),
    ...rows.map(r => r.map(escapeVal).join(','))
  ].join('\n');

  fs.writeFileSync(path.join(outDir, filename), '\uFEFF' + content, 'utf8'); // BOM for Thai Excel
  console.log(`  📄 Exported ${filename} (${rows.length} rows)`);
}

console.log('📦 Exporting all 7 Google Sheets Database CSVs...');

// 1. Master_Users
const users = db.prepare(`
  SELECT 
    u.user_id, u.first_name, u.last_name, u.email, u.phone, 
    d.code as dept_code, s.name as sub_dept_name, u.role, u.status, u.line_user_id, u.last_login_at, u.updated_at
  FROM master_users u
  LEFT JOIN departments d ON u.department_id = d.department_id
  LEFT JOIN sub_departments s ON u.sub_department_id = s.sub_department_id
  ORDER BY u.created_at ASC
`).all();

writeCSV(
  '01_Master_Users.csv',
  ['User ID', 'ชื่อ', 'นามสกุล', 'อีเมล', 'เบอร์โทรศัพท์', 'รหัสฝ่าย (Department Code)', 'ชื่องาน/แผนกย่อย', 'บทบาท (Role)', 'สถานะ (Status)', 'LINE User ID', 'เข้าสู่ระบบล่าสุด', 'อัปเดตล่าสุด'],
  users.map(u => [u.user_id, u.first_name, u.last_name, u.email, u.phone || '-', u.dept_code, u.sub_dept_name, u.role, u.status, u.line_user_id || '-', u.last_login_at, u.updated_at])
);

// 2. Departments
const depts = db.prepare('SELECT department_id, code, name FROM departments ORDER BY code ASC').all();
writeCSV(
  '02_Departments.csv',
  ['รหัสฝ่าย (Department ID)', 'โค้ด (Code)', 'ชื่อฝ่าย'],
  depts.map(d => [d.department_id, d.code, d.name])
);

// 3. Sub_Departments
const subs = db.prepare('SELECT sub_department_id, department_id, code, name FROM sub_departments ORDER BY code ASC').all();
writeCSV(
  '03_Sub_Departments.csv',
  ['รหัสงานย่อย (Sub Dept ID)', 'รหัสฝ่าย (Department ID)', 'โค้ด (Code)', 'ชื่องาน/แผนก'],
  subs.map(s => [s.sub_department_id, s.department_id, s.code, s.name])
);

// 4. Knowledge_Base
const kmItems = db.prepare(`
  SELECT 
    k.knowledge_id, k.content_type, k.title, k.summary, k.content,
    d.name as dept_name, s.name as sub_dept_name, k.tags, k.status,
    k.effective_date, k.expiry_date,
    (SELECT file_url FROM knowledge_attachments WHERE knowledge_id = k.knowledge_id LIMIT 1) as drive_url
  FROM knowledge_items k
  LEFT JOIN departments d ON k.department_id = d.department_id
  LEFT JOIN sub_departments s ON k.sub_department_id = s.sub_department_id
  ORDER BY k.created_at ASC
`).all();

writeCSV(
  '04_Knowledge_Base.csv',
  ['รหัสองค์ความรู้ (Knowledge ID)', 'ประเภท (Content Type)', 'หัวข้อเรื่อง', 'สรุปย่อ (AI Summary)', 'เนื้อหาฉบับเต็ม', 'ฝ่ายที่รับผิดชอบ', 'งาน/แผนกย่อย', 'แท็กคำค้นหา (Tags)', 'สถานะ (Status)', 'วันที่มีผลบังคับใช้', 'วันที่หมดอายุ', 'ลิงก์ Google Drive'],
  kmItems.map(k => [k.knowledge_id, k.content_type, k.title, k.summary, k.content, k.dept_name, k.sub_dept_name, k.tags, k.status, k.effective_date || '-', k.expiry_date || '-', k.drive_url || '-'])
);

// 5. FAQ
const faqs = db.prepare(`
  SELECT 
    k.knowledge_id, k.title, k.summary, d.name as dept_name, k.tags
  FROM knowledge_items k
  LEFT JOIN departments d ON k.department_id = d.department_id
  WHERE k.content_type = 'faq'
`).all();

writeCSV(
  '05_FAQ.csv',
  ['รหัส FAQ', 'คำถาม (Question)', 'คำตอบ (Answer)', 'ฝ่ายที่รับผิดชอบ', 'คำสำคัญ (Keywords)'],
  faqs.map(f => [f.knowledge_id, f.title, f.summary, f.dept_name, f.tags])
);

// 6. Announcements
const anns = db.prepare(`
  SELECT 
    a.announcement_id, a.title, a.content, a.priority, d.name as dept_name, a.created_at
  FROM announcements a
  LEFT JOIN departments d ON a.department_id = d.department_id
`).all();

writeCSV(
  '06_Announcements.csv',
  ['รหัสประกาศ', 'หัวข้อประกาศ', 'เนื้อหาประกาศ', 'ความสำคัญ (normal/urgent/info)', 'ฝ่ายที่ออกประกาศ', 'วันที่ประกาศ'],
  anns.map(a => [a.announcement_id, a.title, a.content, a.priority, a.dept_name || 'ทุกฝ่าย', a.created_at])
);

// 7. News
const news = db.prepare(`
  SELECT 
    k.knowledge_id, k.title, k.content, k.tags, k.created_at
  FROM knowledge_items k
  WHERE k.content_type = 'news'
`).all();

writeCSV(
  '07_News.csv',
  ['รหัสข่าว', 'หัวข้อข่าวประชาสัมพันธ์', 'รายละเอียดข่าว', 'แท็ก (Keywords)', 'วันที่เผยแพร่'],
  news.map(n => [n.knowledge_id, n.title, n.content, n.tags, n.created_at])
);

console.log('✅ All 7 CSV files generated successfully in data/google-sheets-export/!');
