const Database = require('better-sqlite3');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
let parsed = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx !== -1) parsed[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim().replace(/^['\"]|['\"]$/g, '');
  }
}

const supabaseUrl = parsed.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = parsed.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Supabase credentials not found.');
  process.exit(1);
}

const sb = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
const dbPath = path.join(__dirname, '..', 'data', 'pr4fang.db');
const db = new Database(dbPath);

async function syncAll() {
  console.log('🔄 Syncing full DB from Supabase -> SQLite...');

  // 1. Sync master_users first
  const { data: users, error: userErr } = await sb.from('master_users').select('*');
  if (userErr) {
    console.error('Error fetching master_users:', userErr);
    return;
  }
  console.log(`📥 Fetched ${users.length} master_users from Supabase`);

  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO master_users (
      user_id, first_name, last_name, email, password_hash, phone,
      department_id, sub_department_id, role, status, avatar_url,
      line_user_id, failed_login_count, locked_until, last_login_at,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const u of users) {
    insertUser.run(
      u.user_id,
      u.first_name || '',
      u.last_name || '',
      u.email,
      u.password_hash || '$2a$10$placeholder',
      u.phone || null,
      u.department_id || 'dept-01-resource',
      u.sub_department_id || 'sub-01-01',
      u.role || 'staff',
      u.status || 'active',
      u.avatar_url || null,
      u.line_user_id || null,
      u.failed_login_count || 0,
      u.locked_until || null,
      u.last_login_at || null,
      u.created_at || new Date().toISOString(),
      u.updated_at || new Date().toISOString()
    );
  }
  console.log(`✅ Upserted ${users.length} master_users into SQLite`);

  // 2. Fetch knowledge_items
  const { data: kbItems, error: kbErr } = await sb.from('knowledge_items').select('*');
  if (kbErr) {
    console.error('Error fetching knowledge_items from Supabase:', kbErr);
    return;
  }
  console.log(`📥 Fetched ${kbItems.length} knowledge_items from Supabase`);

  const insertKb = db.prepare(`
    INSERT OR REPLACE INTO knowledge_items (
      knowledge_id, content_type, title, summary, content, department_id,
      sub_department_id, tags, status, effective_date, expiry_date,
      ai_retrieval_enabled, view_count, ai_reference_count, sync_status,
      created_by, updated_by, created_at, updated_at, published_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )
  `);

  const txKb = db.transaction((items) => {
    for (const item of items) {
      insertKb.run(
        item.knowledge_id,
        item.content_type || 'document',
        item.title || '',
        item.summary || '',
        item.content || '',
        item.department_id || 'dept-01-resource',
        item.sub_department_id || 'sub-01-01',
        item.tags || '',
        item.status || 'published',
        item.effective_date || null,
        item.expiry_date || null,
        item.ai_retrieval_enabled !== undefined ? (item.ai_retrieval_enabled ? 1 : 0) : 1,
        item.view_count || 0,
        item.ai_reference_count || 0,
        item.sync_status || 'synced',
        item.created_by || 'usr-admin-001',
        item.updated_by || 'usr-admin-001',
        item.created_at || new Date().toISOString(),
        item.updated_at || new Date().toISOString(),
        item.published_at || null
      );
    }
  });

  txKb(kbItems);
  console.log(`✅ Upserted ${kbItems.length} knowledge_items into SQLite`);

  // 3. Fetch knowledge_attachments
  const { data: attItems, error: attErr } = await sb.from('knowledge_attachments').select('*');
  if (attErr) {
    console.error('Error fetching knowledge_attachments from Supabase:', attErr);
    return;
  }
  console.log(`📥 Fetched ${attItems.length} attachments from Supabase`);

  const insertAtt = db.prepare(`
    INSERT OR REPLACE INTO knowledge_attachments (
      attachment_id, knowledge_id, file_name, file_url,
      file_type, file_size_kb, uploaded_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const txAtt = db.transaction((attachments) => {
    for (const att of attachments) {
      insertAtt.run(
        att.attachment_id,
        att.knowledge_id,
        att.file_name || '',
        att.file_url || '',
        att.file_type || 'other',
        att.file_size_kb || 0,
        att.created_at || new Date().toISOString()
      );
    }
  });

  txAtt(attItems);
  console.log(`✅ Upserted ${attItems.length} attachments into SQLite`);

  // 4. Verify counts in SQLite
  const kbCount = db.prepare("SELECT COUNT(*) as cnt FROM knowledge_items WHERE status = 'published' AND ai_retrieval_enabled = 1").get();
  const totalKb = db.prepare("SELECT COUNT(*) as cnt FROM knowledge_items").get();
  console.log(`🎉 SQLite knowledge_items total: ${totalKb.cnt}, published & ai_enabled: ${kbCount.cnt}`);
}

syncAll().catch(console.error);
