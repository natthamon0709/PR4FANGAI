-- =========================================================================
-- PR4Fang AI — Complete Database Schema for Turso (LibSQL / SQLite)
-- Compatible with Vercel Serverless Edge & Local SQLite
-- Total Tables: 35 | Generated: 2026-09-03T13:58:38.938Z
-- =========================================================================

CREATE TABLE activity_feed (
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

CREATE TABLE ai_engine_configs (
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

CREATE TABLE ai_query_logs (
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

CREATE TABLE ai_retrieved_sources (
      source_id TEXT PRIMARY KEY,
      log_id TEXT NOT NULL,
      knowledge_id TEXT NOT NULL,
      relevance_score REAL NOT NULL,
      rank INTEGER NOT NULL,
      FOREIGN KEY (log_id) REFERENCES ai_query_logs(log_id) ON DELETE CASCADE,
      FOREIGN KEY (knowledge_id) REFERENCES knowledge_items(knowledge_id)
    );

CREATE TABLE announcements (
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

CREATE TABLE backup_jobs (
      backup_id TEXT PRIMARY KEY,
      triggered_by TEXT NOT NULL CHECK (triggered_by IN ('manual','scheduled')) DEFAULT 'manual',
      status TEXT NOT NULL CHECK (status IN ('processing','success','failed')) DEFAULT 'processing',
      file_url TEXT,
      file_size INTEGER DEFAULT 0,
      created_by TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (created_by) REFERENCES master_users(user_id)
    );

CREATE TABLE college_profile (
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

CREATE TABLE custom_report_definitions (
      definition_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      metrics TEXT NOT NULL DEFAULT '[]',
      filters TEXT NOT NULL DEFAULT '{}',
      created_by TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (created_by) REFERENCES master_users(user_id)
    );

CREATE TABLE dashboard_summary_cache (
    summary_id TEXT PRIMARY KEY,
    scope TEXT NOT NULL CHECK (scope IN ('global', 'department')),
    department_id TEXT,
    metric_key TEXT NOT NULL,
    metric_value INTEGER NOT NULL DEFAULT 0,
    trend_percent REAL DEFAULT 0.00,
    calculated_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE
  );

CREATE TABLE departments (
    department_id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime'))
  , display_order INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1);

CREATE TABLE drive_media_cache (
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

CREATE TABLE knowledge_attachments (
    attachment_id TEXT PRIMARY KEY,
    knowledge_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf','docx','xlsx','image','other')),
    file_size_kb INTEGER NOT NULL,
    uploaded_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (knowledge_id) REFERENCES knowledge_items(knowledge_id) ON DELETE CASCADE
  );

CREATE TABLE knowledge_gap_logs (
    gap_id TEXT PRIMARY KEY,
    question_text TEXT NOT NULL,
    ask_count INTEGER DEFAULT 1,
    department_guess TEXT,
    status TEXT NOT NULL CHECK (status IN ('open', 'resolved', 'ignored')) DEFAULT 'open',
    last_asked_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (department_guess) REFERENCES departments(department_id)
  );

CREATE TABLE knowledge_items (
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

CREATE TABLE knowledge_version_history (
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

CREATE TABLE line_account_link_requests (
      request_id TEXT PRIMARY KEY,
      master_user_id TEXT NOT NULL,
      verification_code TEXT NOT NULL,
      line_user_id TEXT,
      status TEXT NOT NULL CHECK (status IN ('pending','verified','expired')) DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      expires_at TEXT NOT NULL,
      FOREIGN KEY (master_user_id) REFERENCES master_users(user_id)
    );

CREATE TABLE line_broadcasts (
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

CREATE TABLE line_channel_configs (
      config_id TEXT PRIMARY KEY,
      channel_id TEXT NOT NULL,
      channel_secret_encrypted TEXT NOT NULL,
      channel_access_token_encrypted TEXT NOT NULL,
      webhook_url TEXT NOT NULL,
      webhook_verified INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    , bot_display_name TEXT, bot_basic_id TEXT, bot_picture_url TEXT);

CREATE TABLE line_followers (
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

CREATE TABLE line_rich_menus (
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

CREATE TABLE login_audit_logs (
    log_id TEXT PRIMARY KEY,
    user_id TEXT,
    email_attempted TEXT NOT NULL,
    result TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES master_users(user_id) ON DELETE SET NULL
  );

CREATE TABLE master_users (
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

CREATE TABLE notification_rules (
      rule_id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL UNIQUE CHECK (event_type IN ('pending_review','knowledge_approved','knowledge_sent_back','sync_error','sync_conflict')),
      notify_roles TEXT NOT NULL DEFAULT '["administrator"]',
      notify_channels TEXT NOT NULL DEFAULT '["in_app"]',
      is_active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT DEFAULT (datetime('now', 'localtime'))
    );

CREATE TABLE report_export_logs (
      log_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      report_type TEXT NOT NULL,
      format TEXT NOT NULL CHECK (format IN ('pdf','xlsx')),
      filter_summary TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES master_users(user_id)
    );

CREATE TABLE report_snapshots (
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

CREATE TABLE reset_password_tokens (
    token_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token_hash TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now', 'localtime')),
    FOREIGN KEY (user_id) REFERENCES master_users(user_id) ON DELETE CASCADE
  );

CREATE TABLE scheduled_report_configs (
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

CREATE TABLE security_policies (
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

CREATE TABLE sub_departments (
    sub_department_id TEXT PRIMARY KEY,
    department_id TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now', 'localtime')), display_order INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE
  );

CREATE TABLE sync_conflicts (
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

CREATE TABLE sync_logs (
    log_id TEXT PRIMARY KEY,
    sheet_name TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('db_to_sheet','sheet_to_db')),
    row_reference TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('success','error','conflict')),
    error_message TEXT,
    synced_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

CREATE TABLE system_audit_logs (
      log_id TEXT PRIMARY KEY,
      actor_user_id TEXT,
      action TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      detail TEXT DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (actor_user_id) REFERENCES master_users(user_id) ON DELETE SET NULL
    );

CREATE TABLE system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now', 'localtime'))
  );

CREATE TABLE user_preferences (
      user_id TEXT PRIMARY KEY,
      in_app_notifications INTEGER NOT NULL DEFAULT 1,
      line_notifications INTEGER NOT NULL DEFAULT 1,
      email_notifications INTEGER NOT NULL DEFAULT 0,
      event_types TEXT NOT NULL DEFAULT '["pending_review","knowledge_approved","knowledge_sent_back","sync_error"]',
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (user_id) REFERENCES master_users(user_id) ON DELETE CASCADE
    );
