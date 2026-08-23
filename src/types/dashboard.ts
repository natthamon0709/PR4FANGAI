import { Role, Status } from './index';

export interface KpiMetric {
  key: string;
  label: string;
  value: number;
  displayValue?: string;
  unit?: string;
  trendText?: string;
  trendPercent?: number; // e.g. +12.5 or -3.0
  trendDirection?: 'up' | 'down' | 'neutral';
  color?: 'primary' | 'secondary' | 'success' | 'error';
  href?: string;
}

export interface DepartmentQueryData {
  department_id: string;
  department_name: string;
  code: string;
  query_count: number;
  resolved_count: number;
  success_rate: number;
  color: string;
}

export interface KnowledgeGrowthData {
  month: string; // e.g. 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.'
  total_count: number;
  new_items: number;
}

export interface RecentActivityItem {
  activity_id: string;
  actor_user_id: string;
  actor_name: string;
  action_type: 'create' | 'update' | 'delete';
  target_type: 'knowledge' | 'faq' | 'announcement' | 'news';
  target_id: string;
  department_id: string;
  department_name: string;
  title_snapshot: string;
  created_at: string;
}

export interface KnowledgeGapItem {
  gap_id: string;
  question_text: string;
  ask_count: number;
  department_guess?: string | null;
  department_name?: string | null;
  status: 'open' | 'resolved' | 'ignored';
  last_asked_at: string;
}

export interface AnnouncementItem {
  announcement_id: string;
  title: string;
  content: string;
  priority: 'normal' | 'urgent' | 'info';
  department_id?: string | null;
  department_name?: string | null;
  author_name: string;
  created_at: string;
}

export interface DashboardSummaryResponse {
  role: Role;
  user_department_id?: string;
  calculated_at: string;
  is_cached: boolean;
  kpis: KpiMetric[];
  department_queries?: DepartmentQueryData[];
  knowledge_growth?: KnowledgeGrowthData[];
  recent_activities: RecentActivityItem[];
  knowledge_gaps?: KnowledgeGapItem[];
  announcements: AnnouncementItem[];
  sync_status: {
    pending_count: number;
    last_synced: string;
    sheet_url: string;
  };
}
