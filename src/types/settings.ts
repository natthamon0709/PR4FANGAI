export interface CollegeProfile {
  profile_id: string;
  name_th: string;
  name_en?: string;
  logo_url?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  timezone: string;
  updated_by?: string;
  updated_at: string;
}

export interface SubDepartmentNode {
  sub_department_id: string;
  department_id: string;
  name: string;
  code: string;
  display_order: number;
  is_active: boolean;
  linked_users_count: number;
  linked_knowledge_count: number;
  created_at: string;
}

export interface DepartmentTreeNode {
  department_id: string;
  name: string;
  code: string;
  display_order: number;
  is_active: boolean;
  linked_users_count: number;
  linked_knowledge_count: number;
  sub_departments: SubDepartmentNode[];
  created_at: string;
}

export interface SecurityPolicy {
  policy_id: string;
  password_min_length: number;
  password_require_complexity: boolean;
  max_login_attempts: number;
  lockout_duration_minutes: number;
  session_timeout_hours: number;
  updated_by?: string;
  updated_at: string;
}

export type SystemEventType =
  | 'pending_review'
  | 'knowledge_approved'
  | 'knowledge_sent_back'
  | 'sync_error'
  | 'sync_conflict';

export type NotificationRole = 'administrator' | 'staff';
export type NotificationChannel = 'in_app' | 'line' | 'email';

export interface NotificationRule {
  rule_id: string;
  event_type: SystemEventType;
  notify_roles: NotificationRole[];
  notify_channels: NotificationChannel[];
  is_active: boolean;
  updated_at: string;
}

export interface SystemAuditLog {
  log_id: string;
  actor_user_id?: string;
  actor_name?: string;
  actor_email?: string;
  action: string;
  target_type: string;
  target_id?: string;
  detail: Record<string, any>;
  created_at: string;
}

export interface BackupJob {
  backup_id: string;
  triggered_by: 'manual' | 'scheduled';
  status: 'processing' | 'success' | 'failed';
  file_url?: string;
  file_size: number;
  created_by?: string;
  creator_name?: string;
  created_at: string;
}

export interface IntegrationItem {
  key: 'sheets' | 'ai' | 'line';
  title: string;
  status: 'connected' | 'error' | 'inactive';
  statusLabel: string;
  details: { label: string; value: string | number }[];
  settingsUrl: string;
}

export interface IntegrationsSummaryResponse {
  integrations: IntegrationItem[];
  lastCheckedAt: string;
}

export interface UserPreferences {
  user_id: string;
  in_app_notifications: boolean;
  line_notifications: boolean;
  email_notifications: boolean;
  event_types: SystemEventType[];
  updated_at: string;
}
