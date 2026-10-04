-- ============================================================================
-- PR4Fang AI — Seed Data for Supabase PostgreSQL
-- Fang Industrial and Community Education College
-- ============================================================================

-- 1. Departments (Master 4 ฝ่าย)
INSERT INTO departments (department_id, code, name, display_order, is_active) VALUES
('dept-01-resource', 'RES', 'ฝ่ายบริหารทรัพยากร', 1, 1),
('dept-02-planning', 'PLN', 'ฝ่ายแผนงานและความร่วมมือ', 2, 1),
('dept-03-student', 'STD', 'ฝ่ายพัฒนากิจการนักเรียนนักศึกษา', 3, 1),
('dept-04-academic', 'ACD', 'ฝ่ายวิชาการ', 4, 1)
ON CONFLICT (department_id) DO UPDATE SET
  code = EXCLUDED.code,
  name = EXCLUDED.name;

-- 2. Sub-departments (23 งาน)
INSERT INTO sub_departments (sub_department_id, department_id, code, name, display_order, is_active) VALUES
-- ฝ่ายบริหารทรัพยากร (8 งาน)
('sub-01-01', 'dept-01-resource', 'RES-GEN', 'งานบริหารงานทั่วไป', 1, 1),
('sub-01-02', 'dept-01-resource', 'RES-HR', 'งานบริหารและพัฒนาทรัพยากรบุคคล', 2, 1),
('sub-01-03', 'dept-01-resource', 'RES-FIN', 'งานการเงิน', 3, 1),
('sub-01-04', 'dept-01-resource', 'RES-ACC', 'งานการบัญชี', 4, 1),
('sub-01-05', 'dept-01-resource', 'RES-SUP', 'งานพัสดุ', 5, 1),
('sub-01-06', 'dept-01-resource', 'RES-BLD', 'งานอาคารสถานที่', 6, 1),
('sub-01-07', 'dept-01-resource', 'RES-VEH', 'งานยานพาหนะ', 7, 1),
('sub-01-08', 'dept-01-resource', 'RES-PR', 'งานประชาสัมพันธ์', 8, 1),
-- ฝ่ายแผนงานและความร่วมมือ (5 งาน)
('sub-02-01', 'dept-02-planning', 'PLN-BGT', 'งานวางแผนและงบประมาณ', 1, 1),
('sub-02-02', 'dept-02-planning', 'PLN-DIG', 'งานศูนย์ข้อมูลสารสนเทศและดิจิทัล', 2, 1),
('sub-02-03', 'dept-02-planning', 'PLN-COP', 'งานความร่วมมือ', 3, 1),
('sub-02-04', 'dept-02-planning', 'PLN-RND', 'งานวิจัย พัฒนา นวัตกรรมและสิ่งประดิษฐ์', 4, 1),
('sub-02-05', 'dept-02-planning', 'PLN-QA', 'งานประกันคุณภาพและมาตรฐานการศึกษา', 5, 1),
-- ฝ่ายพัฒนากิจการนักเรียนนักศึกษา (5 งาน)
('sub-03-01', 'dept-03-student', 'STD-ACT', 'งานกิจกรรมนักเรียนนักศึกษา', 1, 1),
('sub-03-02', 'dept-03-student', 'STD-ADV', 'งานครูที่ปรึกษา', 2, 1),
('sub-03-03', 'dept-03-student', 'STD-DIS', 'งานปกครองและสวัสดิการนักเรียนนักศึกษา', 3, 1),
('sub-03-04', 'dept-03-student', 'STD-GUD', 'งานแนะแนวอาชีพและการมีงานทำ', 4, 1),
('sub-03-05', 'dept-03-student', 'STD-SPJ', 'งานโครงการพิเศษและการบริการชุมชน', 5, 1),
-- ฝ่ายวิชาการ (5 งาน)
('sub-04-01', 'dept-04-academic', 'ACD-CUR', 'งานพัฒนาหลักสูตรการเรียนการสอน', 1, 1),
('sub-04-02', 'dept-04-academic', 'ACD-EVA', 'งานวัดผลและประเมินผล', 2, 1),
('sub-04-03', 'dept-04-academic', 'ACD-LIB', 'งานวิทยบริการและห้องสมุด', 3, 1),
('sub-04-04', 'dept-04-academic', 'ACD-DVE', 'งานอาชีวศึกษาระบบทวิภาคี', 4, 1),
('sub-04-05', 'dept-04-academic', 'ACD-REG', 'งานทะเบียน', 5, 1)
ON CONFLICT (sub_department_id) DO UPDATE SET
  code = EXCLUDED.code,
  name = EXCLUDED.name;

-- 3. Master Users (5 ผู้ใช้งานระบบพร้อมรหัสผ่านที่ถูกแฮชด้วย Bcrypt)
-- Password for Admins: 'Admin@12345'
-- Password for Staff: 'Fang@2026'
INSERT INTO master_users (
    user_id, first_name, last_name, email, password_hash, phone,
    department_id, sub_department_id, role, status, line_user_id,
    failed_login_count, last_login_at
) VALUES
('usr-admin-001', 'ผู้ดูแลระบบ', 'ศูนย์ดิจิทัลฯ', 'admin@fang.ac.th', '$2a$12$FwY.9YJPDPcd5bXl9c4bAu1csOINw6zL15tyj/fvJeT6XqMiyyAPi', '053451234', 'dept-02-planning', 'sub-02-02', 'administrator', 'active', 'U1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6', 0, CURRENT_TIMESTAMP),
('usr-admin-002', 'อรวรรณ', 'พงษ์สวัสดิ์', 'orawan@fang.ac.th', '$2a$12$FwY.9YJPDPcd5bXl9c4bAu1csOINw6zL15tyj/fvJeT6XqMiyyAPi', '053451235', 'dept-02-planning', 'sub-02-02', 'administrator', 'active', NULL, 0, CURRENT_TIMESTAMP),
('usr-staff-001', 'สมชาย', 'ใจดี', 'somchai@fang.ac.th', '$2a$12$CJ95ydtf3I1vXwP9SvlPxO2C96jjoDwpl1fPL89gsavyo0dKgy9U2', '0898765432', 'dept-01-resource', 'sub-01-02', 'staff', 'active', 'U2233445566778899aabbccddeeff0011', 0, CURRENT_TIMESTAMP),
('usr-staff-002', 'วิชัย', 'คำแสน', 'wichai@fang.ac.th', '$2a$12$CJ95ydtf3I1vXwP9SvlPxO2C96jjoDwpl1fPL89gsavyo0dKgy9U2', '0812345678', 'dept-04-academic', 'sub-04-05', 'staff', 'suspended', NULL, 0, NULL),
('usr-staff-003', 'สิริพร', 'แก้วมณี', 'siriporn@fang.ac.th', '$2a$12$CJ95ydtf3I1vXwP9SvlPxO2C96jjoDwpl1fPL89gsavyo0dKgy9U2', '0891122334', 'dept-03-student', 'sub-03-04', 'staff', 'active', NULL, 0, CURRENT_TIMESTAMP)
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- 4. System Settings
INSERT INTO system_settings (key, value) VALUES
('site_name', 'PR4Fang AI - ระบบจัดการองค์ความรู้'),
('college_name', 'วิทยาลัยการอาชีพฝาง'),
('database_engine', 'Supabase PostgreSQL (Cloud)'),
('database_status', 'healthy'),
('database_storage', 'Supabase Cloud (Singapore sin1)'),
('n8n_api_key', 'fang_ai_n8n_live_sec_key_2026')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 5. College Profile
INSERT INTO college_profile (
    profile_id, name_th, name_en, logo_url, address, phone, email, website, timezone, updated_by
) VALUES (
    'prof-fang-001',
    'วิทยาลัยการอาชีพฝาง',
    'Fang Industrial and Community Education College',
    '/img/logofve.png',
    'เลขที่ 253 หมู่ 4 ถนนโชตนา ต.เวียง อ.ฝาง จ.เชียงใหม่ 50110',
    '053-453009',
    'fang_icec@vec.mail.go.th',
    'https://www.fve.ac.th',
    'Asia/Bangkok',
    'usr-admin-001'
)
ON CONFLICT (profile_id) DO NOTHING;

-- 6. Security Policy
INSERT INTO security_policies (
    policy_id, password_min_length, password_require_complexity,
    max_login_attempts, lockout_duration_minutes, session_timeout_hours, updated_by
) VALUES (
    'sec-policy-001', 8, 1, 5, 15, 2, 'usr-admin-001'
)
ON CONFLICT (policy_id) DO NOTHING;

-- 7. Notification Rules
INSERT INTO notification_rules (rule_id, event_type, notify_roles, notify_channels, is_active) VALUES
('rule-01', 'pending_review', '["administrator"]', '["in_app","line"]', 1),
('rule-02', 'knowledge_approved', '["staff"]', '["in_app","line"]', 1),
('rule-03', 'knowledge_sent_back', '["staff"]', '["in_app","line"]', 1),
('rule-04', 'sync_error', '["administrator"]', '["in_app","email"]', 1),
('rule-05', 'sync_conflict', '["administrator"]', '["in_app"]', 1)
ON CONFLICT (rule_id) DO NOTHING;

-- 8. User Preferences
INSERT INTO user_preferences (user_id, in_app_notifications, line_notifications, email_notifications, event_types) VALUES
('usr-admin-001', 1, 1, 0, '["pending_review","knowledge_approved","knowledge_sent_back","sync_error","sync_conflict"]'),
('usr-staff-001', 1, 1, 0, '["knowledge_approved","knowledge_sent_back"]')
ON CONFLICT (user_id) DO NOTHING;

-- 9. AI Engine Config
INSERT INTO ai_engine_configs (
    config_id, provider, model_name, api_key_encrypted, system_prompt,
    confidence_threshold, retrieval_top_k, temperature, is_active, updated_by
) VALUES (
    'cfg-ai-001', 'gemini', 'gemini-2.5-flash', 'enc_AIzaSyDefaultMockGeminiApiKeyLive20264f2a',
    'คุณคือผู้ช่วย AI อัจฉริยะประจำวิทยาลัยการอาชีพฝาง ให้ตอบคำถามอย่างสุภาพ ถูกต้อง กระชับ และอ้างอิงจากข้อมูลองค์ความรู้ที่ได้รับเท่านั้น ห้ามคาดเดาข้อมูลที่ไม่ปรากฏในเอกสาร หากไม่พบข้อมูล ให้แนะนำช่องทางติดต่อฝ่ายงานที่เกี่ยวข้องอย่างชัดเจน',
    0.70, 5, 0.3, 1, 'usr-admin-001'
)
ON CONFLICT (config_id) DO NOTHING;

-- 10. LINE Channel Config
INSERT INTO line_channel_configs (
    config_id, channel_id, channel_secret_encrypted, channel_access_token_encrypted,
    webhook_url, webhook_verified, is_active
) VALUES (
    'line-cfg-001', '', '', '', 'https://pr-4-fangai.vercel.app/api/line-oa/webhook', 0, 1
)
ON CONFLICT (config_id) DO NOTHING;

-- 11. LINE Rich Menu
INSERT INTO line_rich_menus (
    menu_id, name, image_url, chat_bar_text, tap_areas, is_default, line_rich_menu_id, created_by
) VALUES (
    'menu-fang-001',
    'เมนูหลักวิทยาลัยการอาชีพฝาง (6 ช่อง)',
    'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&auto=format&fit=crop&q=80',
    'เมนูหลัก',
    '[{"id":"area-1","label":"ถามคำถาม AI","bounds":{"x":0,"y":0,"width":833,"height":843},"action":{"type":"message","text":"สอบถามข้อมูลวิทยาลัย"}},{"id":"area-2","label":"ค้นหาแบบฟอร์ม","bounds":{"x":833,"y":0,"width":833,"height":843},"action":{"type":"message","text":"ขอแบบฟอร์มและคำร้อง"}},{"id":"area-3","label":"ติดต่อเจ้าหน้าที่","bounds":{"x":1666,"y":0,"width":834,"height":843},"action":{"type":"message","text":"เบอร์โทรติดต่อฝ่ายงาน"}},{"id":"area-4","label":"ข่าวและประกาศ","bounds":{"x":0,"y":843,"width":833,"height":843},"action":{"type":"message","text":"ประกาศล่าสุดของวิทยาลัย"}},{"id":"area-5","label":"ปฏิทินการศึกษา","bounds":{"x":833,"y":843,"width":833,"height":843},"action":{"type":"uri","uri":"https://fang.ac.th/calendar"}},{"id":"area-6","label":"เว็บไซต์วิทยาลัย","bounds":{"x":1666,"y":843,"width":834,"height":843},"action":{"type":"uri","uri":"https://fang.ac.th"}}]',
    1,
    'richmenu-fang-main-001',
    'usr-admin-001'
)
ON CONFLICT (menu_id) DO NOTHING;

-- 12. Sheet Sync Config
INSERT INTO sheet_sync_configs (config_id, sheet_name, google_sheet_id, google_tab_gid, target_table, field_mapping, sync_direction, is_active) VALUES
('sync-cfg-001', 'Master_Department', '1-zp32f6bkCcXpGo5O__moHCAXcm_Sjg0rTPRkTK6fYs', '0', 'departments', '{}', 'two_way', 1),
('sync-cfg-002', 'Master_Section', '1-zp32f6bkCcXpGo5O__moHCAXcm_Sjg0rTPRkTK6fYs', '0', 'sub_departments', '{}', 'two_way', 1),
('sync-cfg-003', 'Master_Users', '1-zp32f6bkCcXpGo5O__moHCAXcm_Sjg0rTPRkTK6fYs', '547794364', 'master_users', '{}', 'two_way', 1),
('sync-cfg-005', 'LINE_Configs', '1-zp32f6bkCcXpGo5O__moHCAXcm_Sjg0rTPRkTK6fYs', '0', 'line_channel_configs', '{}', 'two_way', 1)
ON CONFLICT (config_id) DO NOTHING;

-- 13. Scheduled Report Configs
INSERT INTO scheduled_report_configs (config_id, report_type, frequency, recipients, format, is_active, created_by) VALUES
('sched-001', 'ai_performance', 'monthly', '["director@fang.ac.th", "academic@fang.ac.th"]', 'pdf', 1, 'usr-admin-001'),
('sched-002', 'usage', 'weekly', '["admin@fang.ac.th"]', 'xlsx', 1, 'usr-admin-001')
ON CONFLICT (config_id) DO NOTHING;
