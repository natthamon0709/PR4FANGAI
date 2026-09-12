-- ============================================================================
-- PR4Fang AI — PostgreSQL Database Schema for Supabase
-- Fang Industrial and Community Education College
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Auto-update timestamp helper function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ----------------------------------------------------------------------------
-- 1. Departments & Organizational Structure
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS departments (
    department_id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sub_departments (
    sub_department_id VARCHAR(64) PRIMARY KEY,
    department_id VARCHAR(64) NOT NULL REFERENCES departments(department_id) ON DELETE CASCADE,
    code VARCHAR(32) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sub_departments_dept ON sub_departments(department_id);

-- ----------------------------------------------------------------------------
-- 2. Master Users & Authentication
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS master_users (
    user_id VARCHAR(64) PRIMARY KEY,
    first_name VARCHAR(128) NOT NULL,
    last_name VARCHAR(128) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(64),
    department_id VARCHAR(64) NOT NULL REFERENCES departments(department_id),
    sub_department_id VARCHAR(64) NOT NULL REFERENCES sub_departments(sub_department_id),
    role VARCHAR(32) NOT NULL CHECK (role IN ('administrator', 'staff')),
    status VARCHAR(32) NOT NULL CHECK (status IN ('active', 'suspended')) DEFAULT 'active',
    avatar_url TEXT,
    line_user_id VARCHAR(128),
    failed_login_count INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_master_users_email ON master_users(email);
CREATE INDEX IF NOT EXISTS idx_master_users_line ON master_users(line_user_id);
CREATE INDEX IF NOT EXISTS idx_master_users_dept ON master_users(department_id);

CREATE TABLE IF NOT EXISTS reset_password_tokens (
    token_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES master_users(user_id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS login_audit_logs (
    log_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES master_users(user_id) ON DELETE SET NULL,
    email_attempted VARCHAR(255) NOT NULL,
    result VARCHAR(64) NOT NULL,
    ip_address VARCHAR(128) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_login_audit_logs_created ON login_audit_logs(created_at DESC);

-- ----------------------------------------------------------------------------
-- 3. System Settings & Dashboard Cache
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS system_settings (
    key VARCHAR(128) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_summary_cache (
    summary_id VARCHAR(64) PRIMARY KEY,
    scope VARCHAR(32) NOT NULL CHECK (scope IN ('global', 'department')),
    department_id VARCHAR(64) REFERENCES departments(department_id) ON DELETE CASCADE,
    metric_key VARCHAR(64) NOT NULL,
    metric_value INTEGER NOT NULL DEFAULT 0,
    trend_percent NUMERIC(5,2) DEFAULT 0.00,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 4. Knowledge Management (Knowledge Items, Attachments, Versions, Gaps)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS knowledge_items (
    knowledge_id VARCHAR(64) PRIMARY KEY,
    content_type VARCHAR(64) NOT NULL CHECK (content_type IN ('news','announcement','faq','document','manual','regulation','form','service_process')),
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    department_id VARCHAR(64) NOT NULL REFERENCES departments(department_id),
    sub_department_id VARCHAR(64) NOT NULL REFERENCES sub_departments(sub_department_id),
    tags TEXT DEFAULT '[]',
    status VARCHAR(32) NOT NULL CHECK (status IN ('draft','published','archived')) DEFAULT 'draft',
    effective_date VARCHAR(32),
    expiry_date VARCHAR(32),
    ai_retrieval_enabled INTEGER NOT NULL DEFAULT 1,
    view_count INTEGER DEFAULT 0,
    ai_reference_count INTEGER DEFAULT 0,
    sync_status VARCHAR(32) DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error')),
    created_by VARCHAR(64) NOT NULL REFERENCES master_users(user_id),
    updated_by VARCHAR(64) NOT NULL REFERENCES master_users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_knowledge_items_dept ON knowledge_items(department_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_status ON knowledge_items(status);
CREATE INDEX IF NOT EXISTS idx_knowledge_items_type ON knowledge_items(content_type);

CREATE TABLE IF NOT EXISTS knowledge_attachments (
    attachment_id VARCHAR(64) PRIMARY KEY,
    knowledge_id VARCHAR(64) NOT NULL REFERENCES knowledge_items(knowledge_id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(32) NOT NULL CHECK (file_type IN ('pdf','docx','xlsx','image','other')),
    file_size_kb INTEGER NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_knowledge_attachments_item ON knowledge_attachments(knowledge_id);

CREATE TABLE IF NOT EXISTS knowledge_version_history (
    version_id VARCHAR(64) PRIMARY KEY,
    knowledge_id VARCHAR(64) NOT NULL REFERENCES knowledge_items(knowledge_id) ON DELETE CASCADE,
    version_no INTEGER NOT NULL,
    title_snapshot TEXT NOT NULL,
    summary_snapshot TEXT,
    content_snapshot TEXT NOT NULL,
    tags_snapshot TEXT,
    edited_by VARCHAR(64) NOT NULL REFERENCES master_users(user_id),
    edited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS activity_feed (
    activity_id VARCHAR(64) PRIMARY KEY,
    actor_user_id VARCHAR(64) NOT NULL REFERENCES master_users(user_id),
    action_type VARCHAR(32) NOT NULL CHECK (action_type IN ('create', 'update', 'delete')),
    target_type VARCHAR(32) NOT NULL CHECK (target_type IN ('knowledge', 'faq', 'announcement', 'news')),
    target_id VARCHAR(64) NOT NULL,
    department_id VARCHAR(64) NOT NULL REFERENCES departments(department_id),
    title_snapshot TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);

CREATE TABLE IF NOT EXISTS knowledge_gap_logs (
    gap_id VARCHAR(64) PRIMARY KEY,
    question_text TEXT NOT NULL,
    ask_count INTEGER DEFAULT 1,
    department_guess VARCHAR(64) REFERENCES departments(department_id),
    status VARCHAR(32) NOT NULL CHECK (status IN ('open', 'resolved', 'ignored')) DEFAULT 'open',
    last_asked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcements (
    announcement_id VARCHAR(64) PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(32) DEFAULT 'normal' CHECK (priority IN ('normal', 'urgent', 'info')),
    department_id VARCHAR(64) REFERENCES departments(department_id),
    author_user_id VARCHAR(64) NOT NULL REFERENCES master_users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 5. Google Sheets Sync & Integrations
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS sheet_sync_configs (
    config_id VARCHAR(64) PRIMARY KEY,
    sheet_name VARCHAR(128) UNIQUE NOT NULL,
    google_sheet_id VARCHAR(255) NOT NULL,
    google_tab_gid VARCHAR(64) NOT NULL,
    target_table VARCHAR(64) NOT NULL,
    field_mapping TEXT NOT NULL DEFAULT '{}',
    sync_direction VARCHAR(32) NOT NULL CHECK (sync_direction IN ('db_to_sheet','sheet_to_db','two_way')) DEFAULT 'two_way',
    is_active INTEGER NOT NULL DEFAULT 1,
    last_synced_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS sync_logs (
    log_id VARCHAR(64) PRIMARY KEY,
    sheet_name VARCHAR(128) NOT NULL,
    direction VARCHAR(32) NOT NULL CHECK (direction IN ('db_to_sheet','sheet_to_db')),
    row_reference VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL CHECK (status IN ('success','error','conflict')),
    error_message TEXT,
    synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sync_conflicts (
    conflict_id VARCHAR(64) PRIMARY KEY,
    sheet_name VARCHAR(128) NOT NULL,
    record_id VARCHAR(64) NOT NULL,
    record_title TEXT,
    db_value TEXT NOT NULL,
    sheet_value TEXT NOT NULL,
    status VARCHAR(32) NOT NULL CHECK (status IN ('unresolved','resolved_use_db','resolved_use_sheet')) DEFAULT 'unresolved',
    resolved_by VARCHAR(64) REFERENCES master_users(user_id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 6. AI Engine & RAG Tables
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_engine_configs (
    config_id VARCHAR(64) PRIMARY KEY,
    provider VARCHAR(32) NOT NULL CHECK (provider IN ('gemini','openai')) DEFAULT 'gemini',
    model_name VARCHAR(64) NOT NULL DEFAULT 'gemini-2.5-flash',
    api_key_encrypted TEXT NOT NULL,
    system_prompt TEXT NOT NULL,
    confidence_threshold NUMERIC(4,2) NOT NULL DEFAULT 0.70,
    retrieval_top_k INTEGER NOT NULL DEFAULT 5,
    temperature NUMERIC(3,2) NOT NULL DEFAULT 0.3,
    is_active INTEGER NOT NULL DEFAULT 1,
    updated_by VARCHAR(64) NOT NULL REFERENCES master_users(user_id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_query_logs (
    log_id VARCHAR(64) PRIMARY KEY,
    line_user_id VARCHAR(128) NOT NULL,
    matched_user_id VARCHAR(64) REFERENCES master_users(user_id),
    question_text TEXT NOT NULL,
    confidence_score NUMERIC(5,4) NOT NULL,
    answer_text TEXT,
    is_fallback INTEGER NOT NULL DEFAULT 0,
    response_time_ms INTEGER NOT NULL DEFAULT 0,
    feedback VARCHAR(32) NOT NULL CHECK (feedback IN ('none','helpful','not_helpful')) DEFAULT 'none',
    department_id VARCHAR(64) REFERENCES departments(department_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_query_logs_created ON ai_query_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_query_logs_line ON ai_query_logs(line_user_id);

CREATE TABLE IF NOT EXISTS ai_retrieved_sources (
    source_id VARCHAR(64) PRIMARY KEY,
    log_id VARCHAR(64) NOT NULL REFERENCES ai_query_logs(log_id) ON DELETE CASCADE,
    knowledge_id VARCHAR(64) NOT NULL REFERENCES knowledge_items(knowledge_id),
    relevance_score NUMERIC(5,4) NOT NULL,
    rank INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS drive_media_cache (
    media_id VARCHAR(64) PRIMARY KEY,
    folder_id VARCHAR(128),
    file_id VARCHAR(128) NOT NULL,
    title_or_person_name VARCHAR(255) NOT NULL,
    image_url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_type VARCHAR(64) DEFAULT 'image/jpeg',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 7. LINE Official Account Integration
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS line_channel_configs (
    config_id VARCHAR(64) PRIMARY KEY,
    channel_id VARCHAR(128) NOT NULL,
    channel_secret_encrypted TEXT NOT NULL,
    channel_access_token_encrypted TEXT NOT NULL,
    webhook_url TEXT NOT NULL,
    webhook_verified INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    bot_display_name VARCHAR(128),
    bot_basic_id VARCHAR(64),
    bot_picture_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS line_rich_menus (
    menu_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    image_url TEXT NOT NULL,
    chat_bar_text VARCHAR(64) NOT NULL DEFAULT 'เมนูหลัก',
    tap_areas TEXT NOT NULL DEFAULT '[]',
    is_default INTEGER NOT NULL DEFAULT 0,
    line_rich_menu_id VARCHAR(128),
    created_by VARCHAR(64) NOT NULL REFERENCES master_users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS line_broadcasts (
    broadcast_id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message_text TEXT NOT NULL,
    source_knowledge_id VARCHAR(64) REFERENCES knowledge_items(knowledge_id),
    target_type VARCHAR(64) NOT NULL CHECK (target_type IN ('all_followers','linked_staff_department')) DEFAULT 'all_followers',
    department_id VARCHAR(64) REFERENCES departments(department_id),
    scheduled_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(32) NOT NULL CHECK (status IN ('draft','scheduled','sent','failed')) DEFAULT 'draft',
    delivered_count INTEGER NOT NULL DEFAULT 0,
    created_by VARCHAR(64) NOT NULL REFERENCES master_users(user_id),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS line_followers (
    follower_id VARCHAR(64) PRIMARY KEY,
    line_user_id VARCHAR(128) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    avatar_url TEXT,
    linked_master_user_id VARCHAR(64) REFERENCES master_users(user_id),
    followed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    blocked INTEGER NOT NULL DEFAULT 0,
    last_interaction_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_line_followers_user ON line_followers(line_user_id);

CREATE TABLE IF NOT EXISTS line_account_link_requests (
    request_id VARCHAR(64) PRIMARY KEY,
    master_user_id VARCHAR(64) NOT NULL REFERENCES master_users(user_id),
    verification_code VARCHAR(32) NOT NULL,
    line_user_id VARCHAR(128),
    status VARCHAR(32) NOT NULL CHECK (status IN ('pending','verified','expired')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- ----------------------------------------------------------------------------
-- 8. Analytics & Reports
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS report_snapshots (
    snapshot_id VARCHAR(64) PRIMARY KEY,
    metric_key VARCHAR(64) NOT NULL,
    scope VARCHAR(32) NOT NULL CHECK (scope IN ('global','department')) DEFAULT 'global',
    department_id VARCHAR(64) REFERENCES departments(department_id),
    period_type VARCHAR(32) NOT NULL CHECK (period_type IN ('daily','weekly','monthly')) DEFAULT 'daily',
    period_date VARCHAR(32) NOT NULL,
    metric_value NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scheduled_report_configs (
    config_id VARCHAR(64) PRIMARY KEY,
    report_type VARCHAR(64) NOT NULL CHECK (report_type IN ('usage','knowledge','ai_performance','line','custom')) DEFAULT 'usage',
    frequency VARCHAR(32) NOT NULL CHECK (frequency IN ('weekly','monthly')) DEFAULT 'monthly',
    recipients TEXT NOT NULL DEFAULT '[]',
    format VARCHAR(16) NOT NULL CHECK (format IN ('pdf','xlsx')) DEFAULT 'pdf',
    is_active INTEGER NOT NULL DEFAULT 1,
    last_sent_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(64) NOT NULL REFERENCES master_users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS custom_report_definitions (
    definition_id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    metrics TEXT NOT NULL DEFAULT '[]',
    filters TEXT NOT NULL DEFAULT '{}',
    created_by VARCHAR(64) NOT NULL REFERENCES master_users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS report_export_logs (
    log_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES master_users(user_id),
    report_type VARCHAR(64) NOT NULL,
    format VARCHAR(16) NOT NULL CHECK (format IN ('pdf','xlsx')),
    filter_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 9. College Profile & System Policies
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS college_profile (
    profile_id VARCHAR(64) PRIMARY KEY,
    name_th VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    logo_url TEXT,
    address TEXT,
    phone VARCHAR(64),
    email VARCHAR(128),
    website VARCHAR(255),
    timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Bangkok',
    updated_by VARCHAR(64) REFERENCES master_users(user_id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS security_policies (
    policy_id VARCHAR(64) PRIMARY KEY,
    password_min_length INTEGER NOT NULL DEFAULT 8,
    password_require_complexity INTEGER NOT NULL DEFAULT 1,
    max_login_attempts INTEGER NOT NULL DEFAULT 5,
    lockout_duration_minutes INTEGER NOT NULL DEFAULT 15,
    session_timeout_hours INTEGER NOT NULL DEFAULT 2,
    updated_by VARCHAR(64) REFERENCES master_users(user_id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notification_rules (
    rule_id VARCHAR(64) PRIMARY KEY,
    event_type VARCHAR(64) NOT NULL UNIQUE CHECK (event_type IN ('pending_review','knowledge_approved','knowledge_sent_back','sync_error','sync_conflict')),
    notify_roles TEXT NOT NULL DEFAULT '["administrator"]',
    notify_channels TEXT NOT NULL DEFAULT '["in_app"]',
    is_active INTEGER NOT NULL DEFAULT 1,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_audit_logs (
    log_id VARCHAR(64) PRIMARY KEY,
    actor_user_id VARCHAR(64) REFERENCES master_users(user_id) ON DELETE SET NULL,
    action VARCHAR(64) NOT NULL,
    target_type VARCHAR(64) NOT NULL,
    target_id VARCHAR(64),
    detail TEXT DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS backup_jobs (
    backup_id VARCHAR(64) PRIMARY KEY,
    triggered_by VARCHAR(32) NOT NULL CHECK (triggered_by IN ('manual','scheduled')) DEFAULT 'manual',
    status VARCHAR(32) NOT NULL CHECK (status IN ('processing','success','failed')) DEFAULT 'processing',
    file_url TEXT,
    file_size INTEGER DEFAULT 0,
    created_by VARCHAR(64) REFERENCES master_users(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_preferences (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES master_users(user_id) ON DELETE CASCADE,
    in_app_notifications INTEGER NOT NULL DEFAULT 1,
    line_notifications INTEGER NOT NULL DEFAULT 1,
    email_notifications INTEGER NOT NULL DEFAULT 0,
    event_types TEXT NOT NULL DEFAULT '["pending_review","knowledge_approved","knowledge_sent_back","sync_error"]',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ----------------------------------------------------------------------------
-- 10. Supabase Storage Bucket Setup (pr4fang-media)
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('pr4fang-media', 'pr4fang-media', true)
ON CONFLICT (id) DO NOTHING;

-- Public bucket read policy
CREATE POLICY "Public media access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'pr4fang-media');

-- Service Role and Authenticated insert/update policies
CREATE POLICY "Allow authenticated or service upload" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'pr4fang-media');

CREATE POLICY "Allow authenticated or service update" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'pr4fang-media');
