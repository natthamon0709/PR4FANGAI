export type DateRangePreset = "7d" | "30d" | "90d" | "1y" | "custom";

export interface DateRangeFilter {
  preset: DateRangePreset;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  label: string;
}

export interface AnalyticsKpi {
  key: string;
  label: string;
  value: number | string;
  prevValue?: number | string;
  changePercent?: number;
  unit?: string;
  status?: "positive" | "negative" | "neutral";
  tooltip?: string;
}

export interface TrendDataPoint {
  date: string;
  label: string;
  value: number;
  secondaryValue?: number;
}

export interface StackedBarDataPoint {
  date: string;
  label: string;
  high: number;
  medium: number;
  low: number;
  fallback: number;
  total: number;
}

export interface DonutDataPoint {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

export interface RankingItem {
  rank: number;
  id: string;
  title: string;
  subtitle?: string;
  count: number;
  percentage?: number;
  linkUrl?: string;
}

export interface AnalyticsOverviewResponse {
  dateRange: DateRangeFilter;
  kpis: AnalyticsKpi[];
  aiQuestionTrend: TrendDataPoint[];
  topKnowledgeItems: RankingItem[];
  departmentQuestions: RankingItem[];
}

export interface UsageAnalyticsResponse {
  dateRange: DateRangeFilter;
  kpis: AnalyticsKpi[];
  dailyActiveUsersTrend: TrendDataPoint[];
  loginAuditTrend: TrendDataPoint[];
  departmentLogins: RankingItem[];
  recentLogins: {
    log_id: string;
    full_name: string;
    email: string;
    department_name: string;
    role: string;
    ip_address: string;
    logged_in_at: string;
  }[];
  syncErrorCount: number;
}

export interface KnowledgeAnalyticsResponse {
  dateRange: DateRangeFilter;
  kpis: AnalyticsKpi[];
  growthTrend: TrendDataPoint[];
  contentTypeBreakdown: DonutDataPoint[];
  topUsedArticles: RankingItem[];
  departmentContributions: RankingItem[];
}

export interface AiPerformanceResponse {
  dateRange: DateRangeFilter;
  kpis: AnalyticsKpi[];
  confidenceStackedTrend: StackedBarDataPoint[];
  feedbackBreakdown: DonutDataPoint[];
  avgLatencyTrend: TrendDataPoint[];
  topKnowledgeGaps: RankingItem[];
}

export interface LineAnalyticsResponse {
  dateRange: DateRangeFilter;
  kpis: AnalyticsKpi[];
  followerGrowthTrend: TrendDataPoint[];
  accountLinkingBreakdown: DonutDataPoint[];
  recentBroadcasts: {
    broadcast_id: string;
    title: string;
    target_type: string;
    delivered_count: number;
    sent_at: string;
    status: string;
  }[];
}

export interface ScheduledReportConfig {
  config_id: string;
  report_type: "usage" | "knowledge" | "ai_performance" | "line" | "custom";
  frequency: "weekly" | "monthly";
  recipients: string[];
  format: "pdf" | "xlsx";
  is_active: boolean;
  last_sent_at?: string;
  created_by: string;
  created_at: string;
}

export interface CustomReportDefinition {
  definition_id: string;
  name: string;
  metrics: string[];
  filters: Record<string, any>;
  created_by: string;
  created_at: string;
}

export interface ExportReportPayload {
  categories: ("usage" | "knowledge" | "ai" | "line")[];
  startDate: string;
  endDate: string;
  department_id?: string;
  format: "pdf" | "xlsx";
  title?: string;
}
