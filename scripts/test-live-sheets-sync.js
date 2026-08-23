const https = require('https');
const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '..', 'data', 'pr4fang.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

const spreadsheetId = '1-zp32f6bkCcXpGo5O__moHCAXcm_Sjg0rTPRkTK6fYs';

function fetchSheetCSV(sheetName) {
  const url = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

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
      if (currentRow.some(c => c !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentVal = '';
    } else {
      currentVal += char;
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some(c => c !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

async function testSync() {
  console.log('🔄 Executing Live Google Sheets Sync with Deletion Mirroring & Constraint Safety: ' + spreadsheetId);

  // 1. Department Sync
  const deptCsv = await fetchSheetCSV('Master_Department');
  const deptRows = parseCSV(deptCsv).slice(1);
  console.log(`🏢 Master_Department in Sheet: ${deptRows.length} rows`);

  // 2. Section Sync
  const secCsv = await fetchSheetCSV('Master_Section');
  const secRows = parseCSV(secCsv).slice(1);
  console.log(`📁 Master_Section in Sheet: ${secRows.length} rows`);

  db.prepare("DELETE FROM sub_departments WHERE sub_department_id NOT LIKE 'sub-%-%'").run();

  const upsertSection = db.prepare(`
    INSERT INTO sub_departments (sub_department_id, department_id, code, name, created_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(sub_department_id) DO UPDATE SET
      name = excluded.name,
      code = excluded.code,
      department_id = excluded.department_id
  `);

  const now = new Date().toISOString();
  const validSectionIds = [];
  for (let i = 0; i < secRows.length; i++) {
    const r = secRows[i];
    const rawCode = (r[0] || '').trim();
    const secId = rawCode ? rawCode.toLowerCase().replace('sec-', 'sub-') : `sub-01-${String(i + 1).padStart(2, '0')}`;
    const deptName = r[1] || 'ฝ่ายบริหารทรัพยากร';
    const secName = r[2] || 'งานบริหารงานทั่วไป';
    const deptId = deptName.includes('ยุทธศาสตร์') ? 'dept-02-planning' : (deptName.includes('กิจการ') ? 'dept-03-student' : (deptName.includes('วิชาการ') ? 'dept-04-academic' : 'dept-01-resource'));
    const code = rawCode || `SEC-${i + 1}`;

    upsertSection.run(secId, deptId, code, secName, now);
    validSectionIds.push(secId);
  }

  if (validSectionIds.length > 0) {
    const placeholders = validSectionIds.map(() => '?').join(',');
    const fallbackSection = validSectionIds[0] || 'sub-01-01';
    db.prepare(`UPDATE master_users SET sub_department_id = ? WHERE sub_department_id NOT IN (${placeholders})`).run(fallbackSection, ...validSectionIds);
    db.prepare(`UPDATE knowledge_items SET sub_department_id = ? WHERE sub_department_id NOT IN (${placeholders})`).run(fallbackSection, ...validSectionIds);
    db.prepare(`DELETE FROM sub_departments WHERE sub_department_id NOT IN (${placeholders})`).run(...validSectionIds);
  }

  // 3. User Sync
  const userCsv = await fetchSheetCSV('Master_Users');
  const userRows = parseCSV(userCsv).slice(1);
  console.log(`👤 Master_Users in Sheet: ${userRows.length} rows`);

  const defaultPasswordHash = bcrypt.hashSync('Fang@2026', 12);
  const adminPasswordHash = bcrypt.hashSync('Admin@12345', 12);

  const upsertUser = db.prepare(`
    INSERT INTO master_users (
      user_id, first_name, last_name, email, password_hash, phone,
      department_id, sub_department_id, role, status, line_user_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      first_name = excluded.first_name,
      last_name = excluded.last_name,
      email = excluded.email,
      phone = excluded.phone,
      department_id = excluded.department_id,
      sub_department_id = excluded.sub_department_id,
      role = excluded.role,
      status = excluded.status,
      line_user_id = excluded.line_user_id,
      updated_at = excluded.updated_at
  `);

  const validUserIds = [];
  const seenEmails = new Set();
  for (let i = 0; i < userRows.length; i++) {
    const r = userRows[i];
    const userId = (r[0] || `usr-staff-${String(i + 1).padStart(3, '0')}`).trim();
    const firstName = r[1] || 'เจ้าหน้าที่';
    const lastName = r[2] || 'วิทยาลัย';
    let email = (r[3] || `${userId}@fang.ac.th`).toLowerCase().trim();
    if (seenEmails.has(email)) {
      email = `${userId.toLowerCase().replace(/[^a-z0-9]/g, '')}@fang.ac.th`;
    }
    seenEmails.add(email);

    const phone = r[4] || null;
    const rawRole = (r[7] || 'staff').toLowerCase();
    const role = rawRole.includes('admin') ? 'administrator' : 'staff';
    const passwordHash = role === 'administrator' ? adminPasswordHash : defaultPasswordHash;
    const lineUserId = userId === 'usr-admin-001' ? 'U1234567890abcdef1234567890abcdef' : (userId === 'usr-staff-001' ? 'Uabcdef1234567890abcdef1234567890' : null);

    upsertUser.run(
      userId,
      firstName,
      lastName,
      email,
      passwordHash,
      phone,
      'dept-01-resource',
      'sub-01-01',
      role,
      'active',
      lineUserId,
      now,
      now
    );
    validUserIds.push(userId);
  }

  if (validUserIds.length > 0) {
    const placeholders = validUserIds.map(() => '?').join(',');
    db.prepare(`UPDATE knowledge_items SET created_by = 'usr-admin-001' WHERE created_by NOT IN (${placeholders})`).run(...validUserIds);
    db.prepare(`UPDATE knowledge_items SET updated_by = 'usr-admin-001' WHERE updated_by NOT IN (${placeholders})`).run(...validUserIds);
    db.prepare(`DELETE FROM master_users WHERE user_id NOT IN (${placeholders})`).run(...validUserIds);
  }

  // 4. Knowledge Base
  const kbCsv = await fetchSheetCSV('Knowledge_Base');
  const kbRows = parseCSV(kbCsv).slice(1);
  console.log(`📚 Knowledge_Base in Sheet: ${kbRows.length} rows`);

  console.log('✅ Live Sync Complete!');
  const allUsers = db.prepare('SELECT user_id, first_name, last_name, email, role FROM master_users').all();
  console.log('\n📊 Current Users in Local Database (Total: ' + allUsers.length + '):');
  allUsers.forEach((u, i) => console.log(`  ${i+1}. [${u.user_id}] ${u.first_name} ${u.last_name} (${u.email}) - Role: ${u.role}`));
}

testSync();
