export type ContentType = 
  | 'news' 
  | 'announcement' 
  | 'faq' 
  | 'document' 
  | 'manual' 
  | 'regulation' 
  | 'form' 
  | 'service_process';

export type KnowledgeStatus = 'draft' | 'published' | 'archived';

export interface KnowledgeAttachment {
  attachment_id: string;
  knowledge_id: string;
  file_name: string;
  file_url: string;
  file_type: 'pdf' | 'docx' | 'xlsx' | 'image' | 'other';
  file_size_kb: number;
  uploaded_at: string;
}

export interface KnowledgeVersion {
  version_id: string;
  knowledge_id: string;
  version_no: number;
  title_snapshot: string;
  summary_snapshot: string;
  content_snapshot: string;
  tags_snapshot: string[];
  edited_by: string;
  editor_name?: string;
  edited_at: string;
}

export interface KnowledgeItem {
  knowledge_id: string;
  content_type: ContentType;
  title: string;
  summary: string;
  content: string;
  department_id: string;
  sub_department_id: string;
  department_name?: string;
  sub_department_name?: string;
  tags: string[];
  status: KnowledgeStatus;
  effective_date?: string | null;
  expiry_date?: string | null;
  ai_retrieval_enabled: boolean;
  view_count: number;
  ai_reference_count: number;
  sync_status: 'synced' | 'pending' | 'error';
  created_by: string;
  creator_name?: string;
  updated_by: string;
  updater_name?: string;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
  attachments?: KnowledgeAttachment[];
  version_count?: number;
}

export interface KnowledgeListResponse {
  items: KnowledgeItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  typeCounts: Record<ContentType | 'all', number>;
}
