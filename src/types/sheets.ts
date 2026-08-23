export type SheetName = 
  | 'master_users' 
  | 'knowledge' 
  | 'departments' 
  | 'sub_departments' 
  | 'faq' 
  | 'announcement' 
  | 'news';

export type SyncStatus = 'success' | 'pending' | 'error' | 'conflict';
export type SyncDirection = 'db_to_sheet' | 'sheet_to_db' | 'two_way';

export interface SheetSyncConfig {
  config_id: string;
  sheet_name: SheetName;
  sheet_title_th: string;
  google_sheet_id: string;
  google_tab_gid: string;
  target_table: string;
  field_mapping: Record<string, string>;
  sync_direction: SyncDirection;
  is_active: boolean;
  last_synced_at: string | null;
  total_rows?: number;
  pending_count?: number;
  error_count?: number;
  conflict_count?: number;
  status?: SyncStatus;
}

export interface SyncLogItem {
  log_id: string;
  sheet_name: SheetName;
  direction: 'db_to_sheet' | 'sheet_to_db';
  row_reference: string;
  status: 'success' | 'error' | 'conflict';
  error_message?: string | null;
  synced_at: string;
}

export interface SyncConflictItem {
  conflict_id: string;
  sheet_name: SheetName;
  record_id: string;
  record_title: string;
  db_value: Record<string, any>;
  sheet_value: Record<string, any>;
  status: 'unresolved' | 'resolved_use_db' | 'resolved_use_sheet';
  resolved_by?: string | null;
  resolver_name?: string | null;
  resolved_at?: string | null;
  created_at: string;
}

export interface SheetRowItem {
  row_no: number;
  record_id: string;
  title: string;
  summary?: string;
  department_id?: string;
  department_name?: string;
  status: SyncStatus;
  last_modified_by: string;
  last_modified_at: string;
  error_details?: string | null;
}

export interface BulkImportPreviewRow {
  row_no: number;
  data: Record<string, any>;
  validation_status: 'valid' | 'invalid' | 'skipped';
  errors: string[];
}

export interface BulkImportResult {
  total: number;
  valid_count: number;
  invalid_count: number;
  skipped_count: number;
  imported_count: number;
  errors: { row: number; reason: string }[];
}
