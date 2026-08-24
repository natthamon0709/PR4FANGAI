import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

// Singleton database instance
let dbInstance: Database.Database | null = null;

function getDbPath(): string {
  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT
  );

  if (isServerless) {
    const tmpDir = '/tmp';
    const tmpDbPath = path.join(tmpDir, 'pr4fang.db');
    const bundledDbPath = path.join(process.cwd(), 'data', 'pr4fang.db');

    if (!fs.existsSync(tmpDbPath)) {
      if (fs.existsSync(bundledDbPath)) {
        try {
          fs.copyFileSync(bundledDbPath, tmpDbPath);
          if (fs.existsSync(bundledDbPath + '-wal')) {
            try { fs.copyFileSync(bundledDbPath + '-wal', tmpDbPath + '-wal'); } catch {}
          }
          if (fs.existsSync(bundledDbPath + '-shm')) {
            try { fs.copyFileSync(bundledDbPath + '-shm', tmpDbPath + '-shm'); } catch {}
          }
        } catch (err) {
          console.warn('Failed to copy bundled db to /tmp:', err);
        }
      }
    }
    return tmpDbPath;
  }

  const localDbDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(localDbDir)) {
    try {
      fs.mkdirSync(localDbDir, { recursive: true });
    } catch {}
  }
  return path.join(localDbDir, 'pr4fang.db');
}

export function getDb(): Database.Database {
  if (!dbInstance) {
    const dbPath = getDbPath();
    dbInstance = new Database(dbPath);
    try {
      dbInstance.pragma('journal_mode = WAL');
    } catch {}
    try {
      dbInstance.pragma('foreign_keys = ON');
    } catch {}
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

    -- Phase 7: Analytics & Reports Tables
    CREATE TABLE IF NOT EXISTS report_snapshots (
      snapshot_id TEXT PRIMARY KEY,
      metric_key TEXT NOT NULL,
      scope TEXT NOT NULL CHECK (scope IN ('global','department')) DEFAULT 'global',
      department_id TEXT,
      period_type TEXT NOT NULL CHECK (period_type IN ('daily','weekly','monthly')) DEFAULT 'daily',
      period_date TEXT NOT NULL,
      metric_value REAL NOT NULL DEFAULT 0.00,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (department_id) REFERENCES departments(department_id)
    );

    CREATE TABLE IF NOT EXISTS scheduled_report_configs (
      config_id TEXT PRIMARY KEY,
      report_type TEXT NOT NULL CHECK (report_type IN ('usage','knowledge','ai_performance','line','custom')) DEFAULT 'usage',
      frequency TEXT NOT NULL CHECK (frequency IN ('weekly','monthly')) DEFAULT 'monthly',
      recipients TEXT NOT NULL DEFAULT '[]',
      format TEXT NOT NULL CHECK (format IN ('pdf','xlsx')) DEFAULT 'pdf',
      is_active INTEGER NOT NULL DEFAULT 1,
      last_sent_at TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (created_by) REFERENCES master_users(user_id)
    );

    CREATE TABLE IF NOT EXISTS custom_report_definitions (
      definition_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      metrics TEXT NOT NULL DEFAULT '[]',
      filters TEXT NOT NULL DEFAULT '{}',
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (created_by) REFERENCES master_users(user_id)
    );

    CREATE TABLE IF NOT EXISTS report_export_logs (
      log_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      report_type TEXT NOT NULL,
      format TEXT NOT NULL CHECK (format IN ('pdf','xlsx')),
      filter_summary TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES master_users(user_id)
    );

    -- Phase 8: System Settings Tables
    CREATE TABLE IF NOT EXISTS college_profile (
      profile_id TEXT PRIMARY KEY,
      name_th TEXT NOT NULL,
      name_en TEXT,
      logo_url TEXT,
      address TEXT,
      phone TEXT,
      email TEXT,
      website TEXT,
      timezone TEXT NOT NULL DEFAULT 'Asia/Bangkok',
      updated_by TEXT,
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (updated_by) REFERENCES master_users(user_id)
    );

    CREATE TABLE IF NOT EXISTS security_policies (
      policy_id TEXT PRIMARY KEY,
      password_min_length INTEGER NOT NULL DEFAULT 8,
      password_require_complexity INTEGER NOT NULL DEFAULT 1,
      max_login_attempts INTEGER NOT NULL DEFAULT 5,
      lockout_duration_minutes INTEGER NOT NULL DEFAULT 15,
      session_timeout_hours INTEGER NOT NULL DEFAULT 2,
      updated_by TEXT,
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (updated_by) REFERENCES master_users(user_id)
    );

    CREATE TABLE IF NOT EXISTS notification_rules (
      rule_id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL UNIQUE CHECK (event_type IN ('pending_review','knowledge_approved','knowledge_sent_back','sync_error','sync_conflict')),
      notify_roles TEXT NOT NULL DEFAULT '["administrator"]',
      notify_channels TEXT NOT NULL DEFAULT '["in_app"]',
      is_active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS system_audit_logs (
      log_id TEXT PRIMARY KEY,
      actor_user_id TEXT,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      detail TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (actor_user_id) REFERENCES master_users(user_id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS backup_jobs (
      backup_id TEXT PRIMARY KEY,
      triggered_by TEXT NOT NULL CHECK (triggered_by IN ('manual','scheduled')) DEFAULT 'manual',
      status TEXT NOT NULL CHECK (status IN ('processing','success','failed')) DEFAULT 'processing',
      file_url TEXT,
      file_size INTEGER DEFAULT 0,
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (created_by) REFERENCES master_users(user_id)
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT PRIMARY KEY,
      in_app_notifications INTEGER NOT NULL DEFAULT 1,
      line_notifications INTEGER NOT NULL DEFAULT 1,
      email_notifications INTEGER NOT NULL DEFAULT 0,
      event_types TEXT NOT NULL DEFAULT '["pending_review","knowledge_approved","knowledge_sent_back","sync_error"]',
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES master_users(user_id) ON DELETE CASCADE
    );
  `);

  // Safe migrations for newly added columns
  try { db.prepare('ALTER TABLE departments ADD COLUMN display_order INTEGER DEFAULT 0').run(); } catch {}
  try { db.prepare('ALTER TABLE departments ADD COLUMN is_active INTEGER DEFAULT 1').run(); } catch {}
  try { db.prepare('ALTER TABLE sub_departments ADD COLUMN display_order INTEGER DEFAULT 0').run(); } catch {}
  try { db.prepare('ALTER TABLE sub_departments ADD COLUMN is_active INTEGER DEFAULT 1').run(); } catch {}
  try { db.prepare('ALTER TABLE line_channel_configs ADD COLUMN bot_display_name TEXT').run(); } catch {}
  try { db.prepare('ALTER TABLE line_channel_configs ADD COLUMN bot_basic_id TEXT').run(); } catch {}
  try { db.prepare('ALTER TABLE line_channel_configs ADD COLUMN bot_picture_url TEXT').run(); } catch {}

  // 1. Seed Departments & Sub-departments if empty
  const deptCount = (db.prepare('SELECT COUNT(*) as c FROM departments').get() as any).c;
  if (deptCount === 0) {
    const departmentsData = [
      { id: 'dept-01-resource', code: 'RES', name: 'ฝ่ายบริหารทรัพยากร' },
      { id: 'dept-02-planning', code: 'PLN', name: 'ฝ่ายแผนงานและความร่วมมือ' },
      { id: 'dept-03-student', code: 'STD', name: 'ฝ่ายพัฒนากิจการนักเรียนนักศึกษา' },
      { id: 'dept-04-academic', code: 'ACD', name: 'ฝ่ายวิชาการ' }
    ];
    const insertDept = db.prepare('INSERT INTO departments (department_id, code, name) VALUES (?, ?, ?)');
    departmentsData.forEach(d => insertDept.run(d.id, d.code, d.name));

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
  }

  // 2. Seed Master Users if empty
  const userCount = (db.prepare('SELECT COUNT(*) as c FROM master_users').get() as any).c;
  if (userCount === 0) {
    const adminHash = bcrypt.hashSync('Admin@12345', 12);
    const staffHash = bcrypt.hashSync('Fang@2026', 12);
    const insertUser = db.prepare(`
      INSERT INTO master_users (
        user_id, first_name, last_name, email, password_hash,
        phone, department_id, sub_department_id, role, status,
        avatar_url, line_user_id, failed_login_count, last_login_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, 0, datetime('now', 'localtime'))
    `);
    insertUser.run('usr-admin-001', 'ผู้ดูแลระบบ', 'ศูนย์ดิจิทัลฯ', 'admin@fang.ac.th', adminHash, '053451234', 'dept-02-planning', 'sub-02-02', 'administrator', 'active', 'U1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6');
    insertUser.run('usr-staff-001', 'สมชาย', 'ใจดี', 'somchai@fang.ac.th', staffHash, '0898765432', 'dept-01-resource', 'sub-01-02', 'staff', 'active', 'U2233445566778899aabbccddeeff0011');
  }

  // 3. Seed System Settings if empty
  const settingCount = (db.prepare('SELECT COUNT(*) as c FROM system_settings').get() as any).c;
  if (settingCount === 0) {
    const defaultSettings = [
      { key: 'site_name', value: 'PR4Fang AI - ระบบจัดการองค์ความรู้' },
      { key: 'college_name', value: 'วิทยาลัยการอาชีพฝาง' },
      { key: 'google_sheets_id', value: '1-zp32f6bkCcXpGo5O__moHCAXcm_Sjg0rTPRkTK6fYs' },
      { key: 'google_apps_script_url', value: 'https://script.google.com/macros/s/AKfycbxUI67uapRoJ5uuW6lofbVvGmPpY0x3T5-0uTv1QvCLkKmT-ZGLt76DVJGzM6NS49Yi/exec' },
      { key: 'google_account_email', value: 'pr4fang-sync@fang-ai-2026.iam.gserviceaccount.com' },
      { key: 'google_sheets_sync_status', value: 'synced' },
      { key: 'google_sheets_last_synced', value: new Date().toISOString() },
      { key: 'n8n_api_key', value: 'fang_ai_n8n_live_sec_key_2026' }
    ];
    const insertSetting = db.prepare('INSERT OR REPLACE INTO system_settings (key, value) VALUES (?, ?)');
    defaultSettings.forEach(s => insertSetting.run(s.key, s.value));
  }

  // 4. Seed Sheet Sync Configs if empty
  const syncConfigCount = (db.prepare('SELECT COUNT(*) as c FROM sheet_sync_configs').get() as any).c;
  if (syncConfigCount === 0) {
    const SPREADSHEET_ID = '1-zp32f6bkCcXpGo5O__moHCAXcm_Sjg0rTPRkTK6fYs';
    const sheetConfigs = [
      { id: 'sync-cfg-001', name: 'Master_Users', gid: '0', table: 'master_users' },
      { id: 'sync-cfg-002', name: 'Knowledge_Base', gid: '0', table: 'knowledge_items' },
      { id: 'sync-cfg-003', name: 'Knowledge_Gaps', gid: '0', table: 'knowledge_gap_logs' },
      { id: 'sync-cfg-004', name: 'AI_Query_Logs', gid: '0', table: 'ai_query_logs' },
      { id: 'sync-cfg-005', name: 'LINE_Configs', gid: '0', table: 'line_channel_configs' }
    ];
    const insertSync = db.prepare('INSERT OR REPLACE INTO sheet_sync_configs (config_id, sheet_name, google_sheet_id, google_tab_gid, target_table, field_mapping, sync_direction, is_active) VALUES (?, ?, ?, ?, ?, "{}", "two_way", 1)');
    sheetConfigs.forEach(sc => insertSync.run(sc.id, sc.name, SPREADSHEET_ID, sc.gid, sc.table));
  }

  // Seed Default College Profile if empty
  const profileCount = (db.prepare('SELECT COUNT(*) as c FROM college_profile').get() as any).c;
  if (profileCount === 0) {
    db.prepare(`
      INSERT INTO college_profile (
        profile_id, name_th, name_en, logo_url, address, phone, email, website, timezone, updated_by, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Asia/Bangkok', 'usr-admin-001', datetime('now', 'localtime'))
    `).run(
      'prof-fang-001',
      'วิทยาลัยการอาชีพฝาง',
      'Fang Industrial and Community Education College',
      '/img/logofve.png',
      'เลขที่ 253 หมู่ 4 ถนนโชตนา ต.เวียง อ.ฝาง จ.เชียงใหม่ 50110',
      '053-453009',
      'fang_icec@vec.mail.go.th',
      'https://www.fve.ac.th'
    );
  }

  // Seed Default Security Policy if empty
  const secPolicyCount = (db.prepare('SELECT COUNT(*) as c FROM security_policies').get() as any).c;
  if (secPolicyCount === 0) {
    db.prepare(`
      INSERT INTO security_policies (
        policy_id, password_min_length, password_require_complexity,
        max_login_attempts, lockout_duration_minutes, session_timeout_hours,
        updated_by, updated_at
      ) VALUES ('sec-policy-001', 8, 1, 5, 15, 2, 'usr-admin-001', datetime('now', 'localtime'))
    `).run();
  }

  // Seed Default Notification Rules if empty
  const notifRulesCount = (db.prepare('SELECT COUNT(*) as c FROM notification_rules').get() as any).c;
  if (notifRulesCount === 0) {
    const rules = [
      { id: 'rule-01', event: 'pending_review', roles: '["administrator"]', channels: '["in_app","line"]' },
      { id: 'rule-02', event: 'knowledge_approved', roles: '["staff"]', channels: '["in_app","line"]' },
      { id: 'rule-03', event: 'knowledge_sent_back', roles: '["staff"]', channels: '["in_app","line"]' },
      { id: 'rule-04', event: 'sync_error', roles: '["administrator"]', channels: '["in_app","email"]' },
      { id: 'rule-05', event: 'sync_conflict', roles: '["administrator"]', channels: '["in_app"]' }
    ];
    const insertRule = db.prepare('INSERT INTO notification_rules (rule_id, event_type, notify_roles, notify_channels, is_active) VALUES (?, ?, ?, ?, 1)');
    rules.forEach(r => insertRule.run(r.id, r.event, r.roles, r.channels));
  }

  // Seed Default User Preferences if empty
  const prefCount = (db.prepare('SELECT COUNT(*) as c FROM user_preferences').get() as any).c;
  if (prefCount === 0) {
    db.prepare(`
      INSERT OR IGNORE INTO user_preferences (user_id, in_app_notifications, line_notifications, email_notifications, event_types)
      VALUES 
        ('usr-admin-001', 1, 1, 0, '["pending_review","knowledge_approved","knowledge_sent_back","sync_error","sync_conflict"]'),
        ('usr-staff-001', 1, 1, 0, '["knowledge_approved","knowledge_sent_back"]')
    `).run();
  }

  // Seed initial backup job if empty
  const backupCount = (db.prepare('SELECT COUNT(*) as c FROM backup_jobs').get() as any).c;
  if (backupCount === 0) {
    db.prepare(`
      INSERT INTO backup_jobs (backup_id, triggered_by, status, file_url, file_size, created_by, created_at)
      VALUES ('backup-init-001', 'scheduled', 'success', '/api/settings/backup/backup-init-001/download', 148200, 'usr-admin-001', datetime('now', 'localtime'))
    `).run();
  }

  // Seed initial system audit log if empty
  const sysAuditCount = (db.prepare('SELECT COUNT(*) as c FROM system_audit_logs').get() as any).c;
  if (sysAuditCount === 0) {
    db.prepare(`
      INSERT INTO system_audit_logs (log_id, actor_user_id, action, target_type, target_id, detail, created_at)
      VALUES ('sys-log-001', 'usr-admin-001', 'init_system_settings', 'system', 'system', '{"message":"เริ่มต้นระบบการตั้งค่าส่วนกลาง PR4Fang AI KMS"}', datetime('now', 'localtime'))
    `).run();
  }

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
  const hasLineConfigSync = db.prepare("SELECT COUNT(*) as c FROM sheet_sync_configs WHERE sheet_name = 'LINE_Configs'").get() as any;
  if (hasLineConfigSync.c === 0) {
    db.prepare(`
      INSERT INTO sheet_sync_configs (config_id, sheet_name, google_sheet_id, google_tab_gid, target_table, field_mapping, sync_direction, is_active)
      VALUES ('sync-cfg-005', 'LINE_Configs', '1-zp32f6bkCcXpGo5O__moHCAXcm_Sjg0rTPRkTK6fYs', '0', 'line_channel_configs', '{}', 'two_way', 1)
    `).run();
  }

  // Seed default Scheduled Reports if empty
  const schedCount = (db.prepare('SELECT COUNT(*) as c FROM scheduled_report_configs').get() as any).c;
  if (schedCount === 0) {
    db.prepare(`
      INSERT INTO scheduled_report_configs (config_id, report_type, frequency, recipients, format, is_active, created_by, created_at)
      VALUES 
        ('sched-001', 'ai_performance', 'monthly', '["director@fang.ac.th", "academic@fang.ac.th"]', 'pdf', 1, 'usr-admin-001', datetime('now', 'localtime')),
        ('sched-002', 'usage', 'weekly', '["admin@fang.ac.th"]', 'xlsx', 1, 'usr-admin-001', datetime('now', 'localtime'))
    `).run();
  }

  // Seed default Report Snapshots for historical charts if empty
  const snapCount = (db.prepare('SELECT COUNT(*) as c FROM report_snapshots').get() as any).c;
  if (snapCount < 10) {
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO report_snapshots (snapshot_id, metric_key, scope, department_id, period_type, period_date, metric_value, created_at)
      VALUES (?, ?, ?, ?, 'daily', ?, ?, datetime('now', 'localtime'))
    `);
    const now = new Date();
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
    for (let i = 30; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const dayFactor = (30 - i) + Math.sin(i) * 5;
      const qCount = Math.max(12, Math.round(35 + dayFactor * 2.2 + (i % 7 === 0 ? -15 : 10)));
      const activeUsers = Math.max(5, Math.round(18 + (i % 5)));
      const confidence = Math.min(0.96, Math.max(0.72, 0.82 + (Math.sin(i * 0.8) * 0.08)));
      const followers = 140 + Math.round((30 - i) * 3.5);

      insertStmt.run(`snap-q-${dateStr}`, 'ai_question_count', 'global', null, dateStr, qCount);
      insertStmt.run(`snap-u-${dateStr}`, 'active_users', 'global', null, dateStr, activeUsers);
      insertStmt.run(`snap-c-${dateStr}`, 'avg_confidence', 'global', null, dateStr, Math.round(confidence * 100) / 100);
      insertStmt.run(`snap-f-${dateStr}`, 'follower_count', 'global', null, dateStr, followers);
    }
  }
}

export default getDb;
