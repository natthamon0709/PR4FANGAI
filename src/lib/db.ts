import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'pr4fang.db');

// Singleton database instance
let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!dbInstance) {
    dbInstance = new Database(DB_PATH);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
    initTables(dbInstance);
  }
  return dbInstance;
}

function initTables(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      department_id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS sub_departments (
      sub_department_id TEXT PRIMARY KEY,
      department_id TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS master_users (
      user_id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      phone TEXT,
      department_id TEXT NOT NULL,
      sub_department_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('administrator', 'staff')),
      status TEXT NOT NULL CHECK (status IN ('active', 'suspended')),
      avatar_url TEXT,
      line_user_id TEXT,
      failed_login_count INTEGER DEFAULT 0,
      locked_until TEXT,
      last_login_at TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (department_id) REFERENCES departments(department_id),
      FOREIGN KEY (sub_department_id) REFERENCES sub_departments(sub_department_id)
    );

    CREATE TABLE IF NOT EXISTS reset_password_tokens (
      token_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES master_users(user_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS login_audit_logs (
      log_id TEXT PRIMARY KEY,
      user_id TEXT,
      email_attempted TEXT NOT NULL,
      result TEXT NOT NULL,
      ip_address TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES master_users(user_id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS dashboard_summary_cache (
      summary_id TEXT PRIMARY KEY,
      scope TEXT NOT NULL CHECK (scope IN ('global', 'department')),
      department_id TEXT,
      metric_key TEXT NOT NULL,
      metric_value INTEGER NOT NULL DEFAULT 0,
      trend_percent REAL DEFAULT 0.00,
      calculated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS knowledge_items (
      knowledge_id TEXT PRIMARY KEY,
      content_type TEXT NOT NULL CHECK (content_type IN ('news','announcement','faq','document','manual','regulation','form','service_process')),
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      department_id TEXT NOT NULL,
      sub_department_id TEXT NOT NULL,
      tags TEXT DEFAULT '[]',
      status TEXT NOT NULL CHECK (status IN ('draft','published','archived')) DEFAULT 'draft',
      effective_date TEXT,
      expiry_date TEXT,
      ai_retrieval_enabled INTEGER NOT NULL DEFAULT 1,
      view_count INTEGER DEFAULT 0,
      ai_reference_count INTEGER DEFAULT 0,
      sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error')),
      created_by TEXT NOT NULL,
      updated_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      published_at TEXT,
      FOREIGN KEY (department_id) REFERENCES departments(department_id),
      FOREIGN KEY (sub_department_id) REFERENCES sub_departments(sub_department_id),
      FOREIGN KEY (created_by) REFERENCES master_users(user_id),
      FOREIGN KEY (updated_by) REFERENCES master_users(user_id)
    );

    CREATE TABLE IF NOT EXISTS knowledge_attachments (
      attachment_id TEXT PRIMARY KEY,
      knowledge_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_url TEXT NOT NULL,
      file_type TEXT NOT NULL CHECK (file_type IN ('pdf','docx','xlsx','image','other')),
      file_size_kb INTEGER NOT NULL,
      uploaded_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (knowledge_id) REFERENCES knowledge_items(knowledge_id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS knowledge_version_history (
      version_id TEXT PRIMARY KEY,
      knowledge_id TEXT NOT NULL,
      version_no INTEGER NOT NULL,
      title_snapshot TEXT NOT NULL,
      summary_snapshot TEXT,
      content_snapshot TEXT NOT NULL,
      tags_snapshot TEXT,
      edited_by TEXT NOT NULL,
      edited_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (knowledge_id) REFERENCES knowledge_items(knowledge_id) ON DELETE CASCADE,
      FOREIGN KEY (edited_by) REFERENCES master_users(user_id)
    );

    CREATE TABLE IF NOT EXISTS activity_feed (
      activity_id TEXT PRIMARY KEY,
      actor_user_id TEXT NOT NULL,
      action_type TEXT NOT NULL CHECK (action_type IN ('create', 'update', 'delete')),
      target_type TEXT NOT NULL CHECK (target_type IN ('knowledge', 'faq', 'announcement', 'news')),
      target_id TEXT NOT NULL,
      department_id TEXT NOT NULL,
      title_snapshot TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (actor_user_id) REFERENCES master_users(user_id),
      FOREIGN KEY (department_id) REFERENCES departments(department_id)
    );

    CREATE TABLE IF NOT EXISTS knowledge_gap_logs (
      gap_id TEXT PRIMARY KEY,
      question_text TEXT NOT NULL,
      ask_count INTEGER DEFAULT 1,
      department_guess TEXT,
      status TEXT NOT NULL CHECK (status IN ('open', 'resolved', 'ignored')) DEFAULT 'open',
      last_asked_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (department_guess) REFERENCES departments(department_id)
    );

    CREATE TABLE IF NOT EXISTS announcements (
      announcement_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      priority TEXT DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'info')),
      department_id TEXT,
      author_user_id TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (department_id) REFERENCES departments(department_id),
      FOREIGN KEY (author_user_id) REFERENCES master_users(user_id)
    );

    -- Phase 4 Tables: Sheet Sync Configs, Sync Logs, Sync Conflicts
    CREATE TABLE IF NOT EXISTS sheet_sync_configs (
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

    CREATE TABLE IF NOT EXISTS sync_logs (
      log_id TEXT PRIMARY KEY,
      sheet_name TEXT NOT NULL,
      direction TEXT NOT NULL CHECK (direction IN ('db_to_sheet','sheet_to_db')),
      row_reference TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('success','error','conflict')),
      error_message TEXT,
      synced_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS sync_conflicts (
      conflict_id TEXT PRIMARY KEY,
      sheet_name TEXT NOT NULL,
      record_id TEXT NOT NULL,
      record_title TEXT,
      db_value TEXT NOT NULL,
      sheet_value TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('unresolved','resolved_use_db','resolved_use_sheet')) DEFAULT 'unresolved',
      resolved_by TEXT,
      resolved_at TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (resolved_by) REFERENCES master_users(user_id)
    );

    -- Phase 5: AI Engine & RAG Tables
    CREATE TABLE IF NOT EXISTS ai_engine_configs (
      config_id TEXT PRIMARY KEY,
      provider TEXT NOT NULL CHECK (provider IN ('gemini','openai')) DEFAULT 'gemini',
      model_name TEXT NOT NULL DEFAULT 'gemini-2.5-flash',
      api_key_encrypted TEXT NOT NULL,
      system_prompt TEXT NOT NULL,
      confidence_threshold REAL NOT NULL DEFAULT 0.70,
      retrieval_top_k INTEGER NOT NULL DEFAULT 5,
      temperature REAL NOT NULL DEFAULT 0.3,
      is_active INTEGER NOT NULL DEFAULT 1,
      updated_by TEXT NOT NULL,
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (updated_by) REFERENCES master_users(user_id)
    );

    CREATE TABLE IF NOT EXISTS ai_query_logs (
      log_id TEXT PRIMARY KEY,
      line_user_id TEXT NOT NULL,
      matched_user_id TEXT,
      question_text TEXT NOT NULL,
      confidence_score REAL NOT NULL,
      answer_text TEXT,
      is_fallback INTEGER NOT NULL DEFAULT 0,
      response_time_ms INTEGER NOT NULL DEFAULT 0,
      feedback TEXT NOT NULL CHECK (feedback IN ('none','helpful','not_helpful')) DEFAULT 'none',
      department_id TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (matched_user_id) REFERENCES master_users(user_id),
      FOREIGN KEY (department_id) REFERENCES departments(department_id)
    );

    CREATE TABLE IF NOT EXISTS ai_retrieved_sources (
      source_id TEXT PRIMARY KEY,
      log_id TEXT NOT NULL,
      knowledge_id TEXT NOT NULL,
      relevance_score REAL NOT NULL,
      rank INTEGER NOT NULL,
      FOREIGN KEY (log_id) REFERENCES ai_query_logs(log_id) ON DELETE CASCADE,
      FOREIGN KEY (knowledge_id) REFERENCES knowledge_items(knowledge_id)
    );

    CREATE TABLE IF NOT EXISTS drive_media_cache (
      media_id TEXT PRIMARY KEY,
      folder_id TEXT,
      file_id TEXT NOT NULL,
      title_or_person_name TEXT NOT NULL,
      image_url TEXT NOT NULL,
      thumbnail_url TEXT,
      file_type TEXT DEFAULT 'image/jpeg',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    -- Phase 6: LINE Official Account Tables
    CREATE TABLE IF NOT EXISTS line_channel_configs (
      config_id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      channel_secret_encrypted TEXT NOT NULL,
      channel_access_token_encrypted TEXT NOT NULL,
      webhook_url TEXT NOT NULL,
      webhook_verified INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      bot_display_name TEXT,
      bot_basic_id TEXT,
      bot_picture_url TEXT,
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS line_rich_menus (
      menu_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      image_url TEXT NOT NULL,
      chat_bar_text TEXT NOT NULL DEFAULT 'เมนูหลัก',
      tap_areas TEXT NOT NULL DEFAULT '[]',
      is_default INTEGER NOT NULL DEFAULT 0,
      line_rich_menu_id TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (created_by) REFERENCES master_users(user_id)
    );

    CREATE TABLE IF NOT EXISTS line_broadcasts (
      broadcast_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      message_text TEXT NOT NULL,
      source_knowledge_id TEXT,
      target_type TEXT NOT NULL CHECK (target_type IN ('all_followers','linked_staff_department')) DEFAULT 'all_followers',
      department_id TEXT,
      scheduled_at TEXT,
      status TEXT NOT NULL CHECK (status IN ('draft','scheduled','sent','failed')) DEFAULT 'draft',
      delivered_count INTEGER NOT NULL DEFAULT 0,
      created_by TEXT NOT NULL,
      sent_at TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (source_knowledge_id) REFERENCES knowledge_items(knowledge_id),
      FOREIGN KEY (department_id) REFERENCES departments(department_id),
      FOREIGN KEY (created_by) REFERENCES master_users(user_id)
    );

    CREATE TABLE IF NOT EXISTS line_followers (
      follower_id TEXT PRIMARY KEY,
      line_user_id TEXT UNIQUE NOT NULL,
      display_name TEXT,
      avatar_url TEXT,
      linked_master_user_id TEXT,
      followed_at TEXT DEFAULT (datetime('now', 'localtime')),
      blocked INTEGER NOT NULL DEFAULT 0,
      last_interaction_at TEXT,
      FOREIGN KEY (linked_master_user_id) REFERENCES master_users(user_id)
    );

    CREATE TABLE IF NOT EXISTS line_account_link_requests (
      request_id TEXT PRIMARY KEY,
      master_user_id TEXT NOT NULL,
      verification_code TEXT NOT NULL,
      line_user_id TEXT,
      status TEXT NOT NULL CHECK (status IN ('pending','verified','expired')) DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      expires_at TEXT NOT NULL,
      FOREIGN KEY (master_user_id) REFERENCES master_users(user_id)
    );
  `);

  // Safe migrations for newly added columns
  try { db.prepare('ALTER TABLE line_channel_configs ADD COLUMN bot_display_name TEXT').run(); } catch {}
  try { db.prepare('ALTER TABLE line_channel_configs ADD COLUMN bot_basic_id TEXT').run(); } catch {}
  try { db.prepare('ALTER TABLE line_channel_configs ADD COLUMN bot_picture_url TEXT').run(); } catch {}

  // Seed Default AI Config if table is empty
  const configCount = (db.prepare('SELECT COUNT(*) as c FROM ai_engine_configs').get() as any).c;
  if (configCount === 0) {
    const defaultSystemPrompt = 'คุณคือผู้ช่วย AI อัจฉริยะประจำวิทยาลัยการอาชีพฝาง ให้ตอบคำถามอย่างสุภาพ ถูกต้อง กระชับ และอ้างอิงจากข้อมูลองค์ความรู้ที่ได้รับเท่านั้น ห้ามคาดเดาข้อมูลที่ไม่ปรากฏในเอกสาร หากไม่พบข้อมูล ให้แนะนำช่องทางติดต่อฝ่ายงานที่เกี่ยวข้องอย่างชัดเจน';
    db.prepare(`
      INSERT INTO ai_engine_configs (
        config_id, provider, model_name, api_key_encrypted, system_prompt,
        confidence_threshold, retrieval_top_k, temperature, is_active, updated_by, updated_at
      ) VALUES (?, 'gemini', 'gemini-2.5-flash', ?, ?, 0.70, 5, 0.3, 1, 'usr-admin-001', datetime('now', 'localtime'))
    `).run(
      'cfg-ai-001',
      'enc_AIzaSyDefaultMockGeminiApiKeyLive20264f2a',
      defaultSystemPrompt
    );
  }

  // Seed Default LINE Channel Config if table is empty
  // Seed Default LINE Channel Config if table is empty (unconfigured initially)
  const lineConfigCount = (db.prepare('SELECT COUNT(*) as c FROM line_channel_configs').get() as any).c;
  if (lineConfigCount === 0) {
    db.prepare(`
      INSERT INTO line_channel_configs (
        config_id, channel_id, channel_secret_encrypted, channel_access_token_encrypted,
        webhook_url, webhook_verified, is_active, updated_at
      ) VALUES (?, '', '', '', ?, 0, 1, datetime('now', 'localtime'))
    `).run(
      'line-cfg-001',
      'http://localhost:3000/api/line-oa/webhook'
    );
  }

  // Seed Default Rich Menu if empty
  const richMenuCount = (db.prepare('SELECT COUNT(*) as c FROM line_rich_menus').get() as any).c;
  if (richMenuCount === 0) {
    const defaultTapAreas = JSON.stringify([
      { id: 'area-1', label: 'ถามคำถาม AI', bounds: { x: 0, y: 0, width: 833, height: 843 }, action: { type: 'message', text: 'สอบถามข้อมูลวิทยาลัย' } },
      { id: 'area-2', label: 'ค้นหาแบบฟอร์ม', bounds: { x: 833, y: 0, width: 833, height: 843 }, action: { type: 'message', text: 'ขอแบบฟอร์มและคำร้อง' } },
      { id: 'area-3', label: 'ติดต่อเจ้าหน้าที่', bounds: { x: 1666, y: 0, width: 834, height: 843 }, action: { type: 'message', text: 'เบอร์โทรติดต่อฝ่ายงาน' } },
      { id: 'area-4', label: 'ข่าวและประกาศ', bounds: { x: 0, y: 843, width: 833, height: 843 }, action: { type: 'message', text: 'ประกาศล่าสุดของวิทยาลัย' } },
      { id: 'area-5', label: 'ปฏิทินการศึกษา', bounds: { x: 833, y: 843, width: 833, height: 843 }, action: { type: 'uri', uri: 'https://fang.ac.th/calendar' } },
      { id: 'area-6', label: 'เว็บไซต์วิทยาลัย', bounds: { x: 1666, y: 843, width: 834, height: 843 }, action: { type: 'uri', uri: 'https://fang.ac.th' } },
    ]);

    db.prepare(`
      INSERT INTO line_rich_menus (
        menu_id, name, image_url, chat_bar_text, tap_areas, is_default, line_rich_menu_id, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, 1, 'richmenu-fang-main-001', 'usr-admin-001', datetime('now', 'localtime'))
    `).run(
      'menu-fang-001',
      'เมนูหลักวิทยาลัยการอาชีพฝาง (6 ช่อง)',
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
      'เมนูหลัก',
      defaultTapAreas
    );
  }

  // Ensure LINE_Configs is in sheet_sync_configs

  // Ensure LINE_Configs is in sheet_sync_configs
  const hasLineConfigSync = db.prepare("SELECT COUNT(*) as c FROM sheet_sync_configs WHERE sheet_name = 'LINE_Configs'").get() as any;
  if (hasLineConfigSync.c === 0) {
    db.prepare(`
      INSERT INTO sheet_sync_configs (config_id, sheet_name, google_sheet_id, google_tab_gid, target_table, field_mapping, sync_direction, is_active)
      VALUES ('sync-cfg-005', 'LINE_Configs', '1-zp32f6bkCcXpGo5O__moHCAXcm_Sjg0rTPRkTK6fYs', '0', 'line_channel_configs', '{}', 'two_way', 1)
    `).run();
  }
}

export default getDb;
