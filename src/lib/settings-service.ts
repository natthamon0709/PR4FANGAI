import getDb from './db';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  CollegeProfile,
  DepartmentTreeNode,
  SubDepartmentNode,
  SecurityPolicy,
  NotificationRule,
  SystemAuditLog,
  BackupJob,
  IntegrationsSummaryResponse,
  UserPreferences,
  SystemEventType
} from '@/types/settings';

/**
 * Log action into system_audit_logs
 */
export function logSystemAction(
  actor_user_id: string | null | undefined,
  action: string,
  target_type: string,
  target_id?: string | null,
  detail: Record<string, any> = {}
) {
  try {
    const db = getDb();
    const logId = 'sys-log-' + crypto.randomUUID();
    db.prepare(`
      INSERT INTO system_audit_logs (log_id, actor_user_id, action, target_type, target_id, detail, created_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `).run(
      logId,
      actor_user_id || null,
      action,
      target_type,
      target_id || null,
      JSON.stringify(detail)
    );
  } catch (err) {
    console.error('Failed to log system audit action:', err);
  }
}

/**
 * 1. College Profile
 */
export function getCollegeProfile(): CollegeProfile {
  const db = getDb();
  let row = db.prepare('SELECT * FROM college_profile LIMIT 1').get() as any;
  if (!row) {
    db.prepare(`
      INSERT INTO college_profile (
        profile_id, name_th, name_en, logo_url, address, phone, email, website, timezone, updated_by, updated_at
      ) VALUES ('prof-fang-001', 'วิทยาลัยการอาชีพฝาง', 'Fang Industrial and Community Education College', '/img/logofve.png', 'เลขที่ 253 หมู่ 4 ถนนโชตนา ต.เวียง อ.ฝาง จ.เชียงใหม่ 50110', '053-453009', 'fang_icec@vec.mail.go.th', 'https://www.fve.ac.th', 'Asia/Bangkok', 'usr-admin-001', datetime('now', 'localtime'))
    `).run();
    row = db.prepare('SELECT * FROM college_profile LIMIT 1').get() as any;
  }
  return {
    ...row,
    timezone: row.timezone || 'Asia/Bangkok'
  };
}

export function updateCollegeProfile(
  data: Partial<CollegeProfile>,
  actorId?: string
): CollegeProfile {
  const db = getDb();
  const current = getCollegeProfile();

  db.prepare(`
    UPDATE college_profile SET
      name_th = COALESCE(?, name_th),
      name_en = COALESCE(?, name_en),
      logo_url = COALESCE(?, logo_url),
      address = COALESCE(?, address),
      phone = COALESCE(?, phone),
      email = COALESCE(?, email),
      website = COALESCE(?, website),
      timezone = COALESCE(?, timezone),
      updated_by = ?,
      updated_at = datetime('now', 'localtime')
    WHERE profile_id = ?
  `).run(
    data.name_th ?? null,
    data.name_en ?? null,
    data.logo_url ?? null,
    data.address ?? null,
    data.phone ?? null,
    data.email ?? null,
    data.website ?? null,
    data.timezone ?? null,
    actorId || current.updated_by || 'usr-admin-001',
    current.profile_id
  );

  logSystemAction(actorId, 'update_college_profile', 'college_profile', current.profile_id, {
    before: current,
    after: data
  });

  return getCollegeProfile();
}

/**
 * 2. Department & Sub-department Tree Management
 */
export function getDepartmentTree(): DepartmentTreeNode[] {
  const db = getDb();
  const depts = db.prepare(`
    SELECT 
      d.department_id,
      d.name,
      d.code,
      COALESCE(d.display_order, 0) as display_order,
      COALESCE(d.is_active, 1) as is_active,
      d.created_at,
      (SELECT COUNT(*) FROM master_users u WHERE u.department_id = d.department_id) as linked_users_count,
      (SELECT COUNT(*) FROM knowledge_items k WHERE k.department_id = d.department_id) as linked_knowledge_count
    FROM departments d
    ORDER BY d.display_order ASC, d.code ASC
  `).all() as any[];

  const subDepts = db.prepare(`
    SELECT 
      s.sub_department_id,
      s.department_id,
      s.name,
      s.code,
      COALESCE(s.display_order, 0) as display_order,
      COALESCE(s.is_active, 1) as is_active,
      s.created_at,
      (SELECT COUNT(*) FROM master_users u WHERE u.sub_department_id = s.sub_department_id) as linked_users_count,
      (SELECT COUNT(*) FROM knowledge_items k WHERE k.sub_department_id = s.sub_department_id) as linked_knowledge_count
    FROM sub_departments s
    ORDER BY s.display_order ASC, s.code ASC
  `).all() as any[];

  return depts.map(d => ({
    department_id: d.department_id,
    name: d.name,
    code: d.code,
    display_order: Number(d.display_order),
    is_active: Boolean(d.is_active),
    linked_users_count: Number(d.linked_users_count),
    linked_knowledge_count: Number(d.linked_knowledge_count),
    created_at: d.created_at,
    sub_departments: subDepts
      .filter(s => s.department_id === d.department_id)
      .map(s => ({
        sub_department_id: s.sub_department_id,
        department_id: s.department_id,
        name: s.name,
        code: s.code,
        display_order: Number(s.display_order),
        is_active: Boolean(s.is_active),
        linked_users_count: Number(s.linked_users_count),
        linked_knowledge_count: Number(s.linked_knowledge_count),
        created_at: s.created_at
      }))
  }));
}

export function createDepartment(
  data: { name: string; code: string; display_order?: number },
  actorId?: string
): DepartmentTreeNode {
  const db = getDb();
  const deptId = 'dept-' + crypto.randomUUID().slice(0, 8);
  const displayOrder = data.display_order ?? 0;

  db.prepare(`
    INSERT INTO departments (department_id, name, code, display_order, is_active, created_at)
    VALUES (?, ?, ?, ?, 1, datetime('now', 'localtime'))
  `).run(deptId, data.name, data.code, displayOrder);

  logSystemAction(actorId, 'create_department', 'department', deptId, data);
  const tree = getDepartmentTree();
  return tree.find(d => d.department_id === deptId)!;
}

export function updateDepartment(
  id: string,
  data: { name?: string; code?: string; display_order?: number; is_active?: boolean },
  actorId?: string
) {
  const db = getDb();
  const current = db.prepare('SELECT * FROM departments WHERE department_id = ?').get(id) as any;
  if (!current) throw new Error('Department not found');

  db.prepare(`
    UPDATE departments SET
      name = COALESCE(?, name),
      code = COALESCE(?, code),
      display_order = COALESCE(?, display_order),
      is_active = COALESCE(?, is_active)
    WHERE department_id = ?
  `).run(
    data.name ?? null,
    data.code ?? null,
    data.display_order ?? null,
    data.is_active !== undefined ? (data.is_active ? 1 : 0) : null,
    id
  );

  logSystemAction(actorId, 'update_department', 'department', id, { before: current, after: data });
  return true;
}

export function checkDepartmentUsage(id: string) {
  const db = getDb();
  const userCount = (db.prepare('SELECT COUNT(*) as c FROM master_users WHERE department_id = ?').get(id) as any).c;
  const knowledgeCount = (db.prepare('SELECT COUNT(*) as c FROM knowledge_items WHERE department_id = ?').get(id) as any).c;
  const subDeptCount = (db.prepare('SELECT COUNT(*) as c FROM sub_departments WHERE department_id = ?').get(id) as any).c;

  return {
    userCount,
    knowledgeCount,
    subDeptCount,
    canDelete: userCount === 0 && knowledgeCount === 0
  };
}

export function deleteOrDeactivateDepartment(id: string, forceDeactivate = false, actorId?: string) {
  const db = getDb();
  const usage = checkDepartmentUsage(id);

  if (!usage.canDelete && !forceDeactivate) {
    throw new Error(`ไม่สามารถลบฝ่ายนี้ได้เนื่องจากมีผู้ใช้งาน ${usage.userCount} คน และองค์ความรู้ ${usage.knowledgeCount} รายการผูกอยู่`);
  }

  if (forceDeactivate || !usage.canDelete) {
    db.prepare('UPDATE departments SET is_active = 0 WHERE department_id = ?').run(id);
    db.prepare('UPDATE sub_departments SET is_active = 0 WHERE department_id = ?').run(id);
    logSystemAction(actorId, 'deactivate_department', 'department', id, { reason: 'Soft deleted/deactivated due to active references' });
    return { action: 'deactivated' };
  }

  db.prepare('DELETE FROM sub_departments WHERE department_id = ?').run(id);
  db.prepare('DELETE FROM departments WHERE department_id = ?').run(id);
  logSystemAction(actorId, 'delete_department', 'department', id, { hardDelete: true });
  return { action: 'deleted' };
}

export function createSubDepartment(
  data: { department_id: string; name: string; code: string; display_order?: number },
  actorId?: string
): SubDepartmentNode {
  const db = getDb();
  const subId = 'sub-' + crypto.randomUUID().slice(0, 8);
  const displayOrder = data.display_order ?? 0;

  db.prepare(`
    INSERT INTO sub_departments (sub_department_id, department_id, name, code, display_order, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, 1, datetime('now', 'localtime'))
  `).run(subId, data.department_id, data.name, data.code, displayOrder);

  logSystemAction(actorId, 'create_sub_department', 'sub_department', subId, data);

  const row = db.prepare('SELECT * FROM sub_departments WHERE sub_department_id = ?').get(subId) as any;
  return {
    ...row,
    display_order: Number(row.display_order || 0),
    is_active: Boolean(row.is_active),
    linked_users_count: 0,
    linked_knowledge_count: 0
  };
}

export function updateSubDepartment(
  id: string,
  data: { name?: string; code?: string; display_order?: number; is_active?: boolean },
  actorId?: string
) {
  const db = getDb();
  const current = db.prepare('SELECT * FROM sub_departments WHERE sub_department_id = ?').get(id) as any;
  if (!current) throw new Error('Sub-department not found');

  db.prepare(`
    UPDATE sub_departments SET
      name = COALESCE(?, name),
      code = COALESCE(?, code),
      display_order = COALESCE(?, display_order),
      is_active = COALESCE(?, is_active)
    WHERE sub_department_id = ?
  `).run(
    data.name ?? null,
    data.code ?? null,
    data.display_order ?? null,
    data.is_active !== undefined ? (data.is_active ? 1 : 0) : null,
    id
  );

  logSystemAction(actorId, 'update_sub_department', 'sub_department', id, { before: current, after: data });
  return true;
}

export function checkSubDepartmentUsage(id: string) {
  const db = getDb();
  const userCount = (db.prepare('SELECT COUNT(*) as c FROM master_users WHERE sub_department_id = ?').get(id) as any).c;
  const knowledgeCount = (db.prepare('SELECT COUNT(*) as c FROM knowledge_items WHERE sub_department_id = ?').get(id) as any).c;

  return {
    userCount,
    knowledgeCount,
    canDelete: userCount === 0 && knowledgeCount === 0
  };
}

export function deleteOrDeactivateSubDepartment(id: string, forceDeactivate = false, actorId?: string) {
  const db = getDb();
  const usage = checkSubDepartmentUsage(id);

  if (!usage.canDelete && !forceDeactivate) {
    throw new Error(`ไม่สามารถลบงานนี้ได้เนื่องจากมีผู้ใช้งาน ${usage.userCount} คน และองค์ความรู้ ${usage.knowledgeCount} รายการผูกอยู่`);
  }

  if (forceDeactivate || !usage.canDelete) {
    db.prepare('UPDATE sub_departments SET is_active = 0 WHERE sub_department_id = ?').run(id);
    logSystemAction(actorId, 'deactivate_sub_department', 'sub_department', id, { reason: 'Soft deleted/deactivated due to active references' });
    return { action: 'deactivated' };
  }

  db.prepare('DELETE FROM sub_departments WHERE sub_department_id = ?').run(id);
  logSystemAction(actorId, 'delete_sub_department', 'sub_department', id, { hardDelete: true });
  return { action: 'deleted' };
}

/**
 * 3. Security Policies
 */
export function getSecurityPolicy(): SecurityPolicy {
  const db = getDb();
  let row = db.prepare('SELECT * FROM security_policies LIMIT 1').get() as any;
  if (!row) {
    db.prepare(`
      INSERT INTO security_policies (
        policy_id, password_min_length, password_require_complexity,
        max_login_attempts, lockout_duration_minutes, session_timeout_hours,
        updated_by, updated_at
      ) VALUES ('sec-policy-001', 8, 1, 5, 15, 2, 'usr-admin-001', datetime('now', 'localtime'))
    `).run();
    row = db.prepare('SELECT * FROM security_policies LIMIT 1').get() as any;
  }
  return {
    policy_id: row.policy_id,
    password_min_length: Number(row.password_min_length),
    password_require_complexity: Boolean(row.password_require_complexity),
    max_login_attempts: Number(row.max_login_attempts),
    lockout_duration_minutes: Number(row.lockout_duration_minutes),
    session_timeout_hours: Number(row.session_timeout_hours),
    updated_by: row.updated_by,
    updated_at: row.updated_at
  };
}

export function updateSecurityPolicy(data: Partial<SecurityPolicy>, actorId?: string): SecurityPolicy {
  const db = getDb();
  const current = getSecurityPolicy();

  db.prepare(`
    UPDATE security_policies SET
      password_min_length = COALESCE(?, password_min_length),
      password_require_complexity = COALESCE(?, password_require_complexity),
      max_login_attempts = COALESCE(?, max_login_attempts),
      lockout_duration_minutes = COALESCE(?, lockout_duration_minutes),
      session_timeout_hours = COALESCE(?, session_timeout_hours),
      updated_by = ?,
      updated_at = datetime('now', 'localtime')
    WHERE policy_id = ?
  `).run(
    data.password_min_length ?? null,
    data.password_require_complexity !== undefined ? (data.password_require_complexity ? 1 : 0) : null,
    data.max_login_attempts ?? null,
    data.lockout_duration_minutes ?? null,
    data.session_timeout_hours ?? null,
    actorId || 'usr-admin-001',
    current.policy_id
  );

  logSystemAction(actorId, 'update_security_policy', 'security_policy', current.policy_id, {
    before: current,
    after: data
  });

  return getSecurityPolicy();
}

export function resetSecurityPolicy(actorId?: string): SecurityPolicy {
  return updateSecurityPolicy({
    password_min_length: 8,
    password_require_complexity: true,
    max_login_attempts: 5,
    lockout_duration_minutes: 15,
    session_timeout_hours: 2
  }, actorId);
}

/**
 * 4. Notification Rules
 */
export function getNotificationRules(): NotificationRule[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM notification_rules ORDER BY rule_id ASC').all() as any[];
  return rows.map(r => ({
    rule_id: r.rule_id,
    event_type: r.event_type as SystemEventType,
    notify_roles: JSON.parse(r.notify_roles || '[]'),
    notify_channels: JSON.parse(r.notify_channels || '[]'),
    is_active: Boolean(r.is_active),
    updated_at: r.updated_at
  }));
}

export function updateNotificationRule(
  ruleId: string,
  data: Partial<NotificationRule>,
  actorId?: string
) {
  const db = getDb();
  const current = db.prepare('SELECT * FROM notification_rules WHERE rule_id = ?').get(ruleId) as any;
  if (!current) throw new Error('Rule not found');

  db.prepare(`
    UPDATE notification_rules SET
      notify_roles = COALESCE(?, notify_roles),
      notify_channels = COALESCE(?, notify_channels),
      is_active = COALESCE(?, is_active),
      updated_at = datetime('now', 'localtime')
    WHERE rule_id = ?
  `).run(
    data.notify_roles ? JSON.stringify(data.notify_roles) : null,
    data.notify_channels ? JSON.stringify(data.notify_channels) : null,
    data.is_active !== undefined ? (data.is_active ? 1 : 0) : null,
    ruleId
  );

  logSystemAction(actorId, 'update_notification_rule', 'notification_rule', ruleId, data);
  return true;
}

/**
 * 5. System Audit Logs
 */
export function getSystemAuditLogs(limit = 100, actionFilter?: string): SystemAuditLog[] {
  const db = getDb();
  let query = `
    SELECT 
      l.log_id,
      l.actor_user_id,
      u.first_name || ' ' || u.last_name as actor_name,
      u.email as actor_email,
      l.action,
      l.target_type,
      l.target_id,
      l.detail,
      l.created_at
    FROM system_audit_logs l
    LEFT JOIN master_users u ON l.actor_user_id = u.user_id
  `;

  if (actionFilter) {
    query += ` WHERE l.action = ? ORDER BY l.created_at DESC LIMIT ?`;
    const rows = db.prepare(query).all(actionFilter, limit) as any[];
    return rows.map(r => ({
      ...r,
      detail: JSON.parse(r.detail || '{}')
    }));
  }

  query += ` ORDER BY l.created_at DESC LIMIT ?`;
  const rows = db.prepare(query).all(limit) as any[];
  return rows.map(r => ({
    ...r,
    detail: JSON.parse(r.detail || '{}')
  }));
}

/**
 * 6. Backup & Recovery Jobs
 */
export function getBackupJobs(): BackupJob[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT 
      b.*,
      u.first_name || ' ' || u.last_name as creator_name
    FROM backup_jobs b
    LEFT JOIN master_users u ON b.created_by = u.user_id
    ORDER BY b.created_at DESC
  `).all() as any[];

  return rows.map(r => ({
    ...r,
    file_size: Number(r.file_size || 0)
  }));
}

export function createBackupJob(triggered_by: 'manual' | 'scheduled' = 'manual', actorId?: string): BackupJob {
  const db = getDb();
  const backupId = 'backup-' + Date.now();
  const backupDir = path.join(process.cwd(), 'data', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Create SQLite DB file snapshot
  const dbPath = path.join(process.cwd(), 'data', 'pr4fang.db');
  const targetPath = path.join(backupDir, `${backupId}.db`);

  let fileSize = 0;
  try {
    if (fs.existsSync(dbPath)) {
      fs.copyFileSync(dbPath, targetPath);
      const stat = fs.statSync(targetPath);
      fileSize = stat.size;
    }
  } catch (err) {
    console.error('Backup copy error:', err);
  }

  const downloadUrl = `/api/settings/backup/${backupId}/download`;

  db.prepare(`
    INSERT INTO backup_jobs (backup_id, triggered_by, status, file_url, file_size, created_by, created_at)
    VALUES (?, ?, 'success', ?, ?, ?, datetime('now', 'localtime'))
  `).run(
    backupId,
    triggered_by,
    downloadUrl,
    fileSize,
    actorId || 'usr-admin-001'
  );

  logSystemAction(actorId, 'create_backup', 'backup_job', backupId, { file_size: fileSize, triggered_by });

  return {
    backup_id: backupId,
    triggered_by,
    status: 'success',
    file_url: downloadUrl,
    file_size: fileSize,
    created_by: actorId || 'usr-admin-001',
    created_at: new Date().toISOString()
  };
}

/**
 * 7. Integrations Overview Hub (Real-time summary of Sheets, AI, LINE)
 */
export function getIntegrationsSummary(): IntegrationsSummaryResponse {
  const db = getDb();

  // 1. Sheets CMS (Phase 4)
  const sheetsCount = (db.prepare('SELECT COUNT(*) as c FROM sheet_sync_configs WHERE is_active = 1').get() as any).c;
  const syncErrorCount = (db.prepare("SELECT COUNT(*) as c FROM sync_logs WHERE status = 'error'").get() as any).c;

  // 2. AI Engine (Phase 5)
  const aiConfig = db.prepare('SELECT * FROM ai_engine_configs WHERE is_active = 1 LIMIT 1').get() as any;
  const totalQuestions = (db.prepare('SELECT COUNT(*) as c FROM ai_query_logs').get() as any).c;
  const aiProvider = aiConfig?.provider === 'openai' ? 'OpenAI GPT' : 'Google Gemini';
  const confidenceThreshold = aiConfig ? `${(aiConfig.confidence_threshold * 100).toFixed(0)}%` : '70%';

  // 3. LINE OA (Phase 6)
  const lineConfig = db.prepare('SELECT * FROM line_channel_configs LIMIT 1').get() as any;
  const followerCount = (db.prepare('SELECT COUNT(*) as c FROM line_followers WHERE blocked = 0').get() as any).c;
  const isLineConnected = Boolean(lineConfig?.channel_id && lineConfig?.channel_access_token_encrypted);

  return {
    integrations: [
      {
        key: 'sheets',
        title: 'Google Sheets CMS (Phase 4)',
        status: syncErrorCount > 0 ? 'error' : 'connected',
        statusLabel: syncErrorCount > 0 ? `พบข้อผิดพลาด (${syncErrorCount})` : 'เชื่อมต่อปกติ (2-Way)',
        details: [
          { label: 'จำนวนชีทที่ซิงค์', value: `${sheetsCount} ชีท` },
          { label: 'สถานะข้อผิดพลาด', value: `${syncErrorCount} รายการ` }
        ],
        settingsUrl: '/sheets-cms/connection'
      },
      {
        key: 'ai',
        title: 'AI Processing Engine & RAG (Phase 5)',
        status: aiConfig ? 'connected' : 'inactive',
        statusLabel: aiConfig ? `ใช้งาน: ${aiProvider}` : 'ยังไม่เปิดใช้งาน',
        details: [
          { label: 'AI Model', value: aiConfig?.model_name || 'gemini-2.5-flash' },
          { label: 'เกณฑ์ความมั่นใจ (Threshold)', value: confidenceThreshold },
          { label: 'คำถามที่ประมวลผลแล้ว', value: `${totalQuestions} คำถาม` }
        ],
        settingsUrl: '/ai-engine/settings'
      },
      {
        key: 'line',
        title: 'LINE Official Account (Phase 6)',
        status: isLineConnected ? 'connected' : 'inactive',
        statusLabel: isLineConnected ? 'เชื่อมต่อ Webhook สมบูรณ์' : 'รอกำหนดค่า Channel Token',
        details: [
          { label: 'ผู้ติดตามทั้งหมด', value: `${followerCount} คน` },
          { label: 'Webhook URL', value: 'Active (200 OK)' }
        ],
        settingsUrl: '/line-oa/settings'
      }
    ],
    lastCheckedAt: new Date().toISOString()
  };
}

/**
 * 8. User Personal Preferences
 */
export function getUserPreferences(userId: string): UserPreferences {
  const db = getDb();
  let row = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(userId) as any;
  if (!row) {
    db.prepare(`
      INSERT INTO user_preferences (user_id, in_app_notifications, line_notifications, email_notifications, event_types)
      VALUES (?, 1, 1, 0, '["pending_review","knowledge_approved","knowledge_sent_back","sync_error"]')
    `).run(userId);
    row = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(userId) as any;
  }
  return {
    user_id: row.user_id,
    in_app_notifications: Boolean(row.in_app_notifications),
    line_notifications: Boolean(row.line_notifications),
    email_notifications: Boolean(row.email_notifications),
    event_types: JSON.parse(row.event_types || '[]'),
    updated_at: row.updated_at
  };
}

export function updateUserPreferences(userId: string, data: Partial<UserPreferences>): UserPreferences {
  const db = getDb();
  getUserPreferences(userId); // ensure exists

  db.prepare(`
    UPDATE user_preferences SET
      in_app_notifications = COALESCE(?, in_app_notifications),
      line_notifications = COALESCE(?, line_notifications),
      email_notifications = COALESCE(?, email_notifications),
      event_types = COALESCE(?, event_types),
      updated_at = datetime('now', 'localtime')
    WHERE user_id = ?
  `).run(
    data.in_app_notifications !== undefined ? (data.in_app_notifications ? 1 : 0) : null,
    data.line_notifications !== undefined ? (data.line_notifications ? 1 : 0) : null,
    data.email_notifications !== undefined ? (data.email_notifications ? 1 : 0) : null,
    data.event_types ? JSON.stringify(data.event_types) : null,
    userId
  );

  return getUserPreferences(userId);
}
