export type AiProvider = 'gemini' | 'openai';

export interface AiEngineConfig {
  config_id: string;
  provider: AiProvider;
  model_name: string;
  api_key_masked: string;
  api_key_encrypted?: string;
  system_prompt: string;
  confidence_threshold: number; // 0.00 - 1.00
  retrieval_top_k: number; // 1 - 10
  temperature: number; // 0.0 - 1.0
  is_active: boolean;
  updated_by?: string;
  updated_at?: string;
}

export type FeedbackType = 'none' | 'helpful' | 'not_helpful';

export interface AiRetrievedSource {
  source_id: string;
  log_id: string;
  knowledge_id: string;
  title: string;
  content_type: string;
  department_id?: string;
  department_name?: string;
  relevance_score: number; // 0.00 - 1.00
  rank: number;
}

export interface AiQueryLog {
  log_id: string;
  line_user_id: string;
  matched_user_id?: string | null;
  matched_user_name?: string | null;
  matched_user_role?: string | null;
  matched_user_email?: string | null;
  question_text: string;
  confidence_score: number; // 0.00 - 1.00
  answer_text?: string | null;
  is_fallback: boolean;
  response_time_ms: number;
  feedback: FeedbackType;
  department_id?: string | null;
  department_name?: string | null;
  created_at: string;
  sources?: AiRetrievedSource[];
  is_marked_gap?: boolean;
}

export interface RAGPlaygroundResult {
  question: string;
  answer: string;
  confidence_score: number;
  is_fallback: boolean;
  response_time_ms: number;
  imageUrl?: string;
  imageCaption?: string;
  sources: {
    knowledge_id: string;
    title: string;
    content_type: string;
    department_name: string;
    relevance_score: number;
    rank: number;
  }[];
}
