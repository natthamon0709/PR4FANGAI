'use client';
import React, { useState } from 'react';
import { X, Bot, Clock, AlertTriangle, ShieldCheck, FileText, UserCheck, MessageSquare, ExternalLink } from 'lucide-react';
import ConfidenceScoreBar from './ConfidenceScoreBar';
import FeedbackBadge from './FeedbackBadge';
import MarkAsGapButton from './MarkAsGapButton';
import RetrievedSourceCard from './RetrievedSourceCard';
import { AiQueryLog, FeedbackType } from '@/types/ai';

interface AiLogDetailPanelProps {
  log: AiQueryLog | null;
  onClose: () => void;
  onFeedbackChange?: (logId: string, feedback: FeedbackType) => void;
  onMarkGapSuccess?: () => void;
}

export default function AiLogDetailPanel({
  log,
  onClose,
  onFeedbackChange,
  onMarkGapSuccess
}: AiLogDetailPanelProps) {
  const [currentFeedback, setCurrentFeedback] = useState<FeedbackType>(log?.feedback || 'none');

  if (!log) return null;

  const handleFeedback = async (val: FeedbackType) => {
    setCurrentFeedback(val);
    try {
      await fetch('/api/ai-engine/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log_id: log.log_id, feedback: val })
      });
      onFeedbackChange?.(log.log_id, val);
    } catch (e) {
      console.error('Failed to submit feedback:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl max-h-[90vh] bg-surface-card rounded-3xl border border-outline/30 shadow-level3 flex flex-col overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="px-6 py-4 bg-surface-variant/40 border-b border-outline/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm md:text-base text-onSurface">
                รายละเอียดการสนทนา (AI Query Log)
              </h3>
              <p className="text-[11px] font-mono text-onSurface-muted">
                Log ID: {log.log_id}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-onSurface-muted hover:text-onSurface hover:bg-surface-variant transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs md:text-sm">
          {/* Metadata Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-2xl bg-surface border border-outline/20 text-xs">
            <div>
              <span className="text-[10px] text-onSurface-muted block">เวลาที่ถาม</span>
              <span className="font-mono text-onSurface font-medium">
                {new Date(log.created_at).toLocaleString('th-TH')}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-onSurface-muted block">เวลาประมวลผล</span>
              <span className="font-mono text-onSurface font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-primary" />
                <span>{log.response_time_ms} ms</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] text-onSurface-muted block">ผู้ใช้งาน LINE</span>
              <span className="font-mono text-onSurface font-medium truncate block" title={log.line_user_id}>
                {log.matched_user_name ? `${log.matched_user_name} (${log.matched_user_role || 'บุคลากร'})` : 'บุคคลภายนอก (Guest)'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-onSurface-muted block">ฝ่ายที่เกี่ยวข้อง</span>
              <span className="text-onSurface font-medium truncate block">
                {log.department_name || 'ส่วนกลาง'}
              </span>
            </div>
          </div>

          {/* User Question */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-onSurface flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              <span>ข้อความคำถามจากผู้ใช้ (Question):</span>
            </label>
            <div className="p-3.5 rounded-2xl bg-primary-container/40 text-onPrimaryContainer font-medium leading-relaxed border border-primary/20">
              {log.question_text}
            </div>
          </div>

          {/* Confidence Score Bar */}
          <div className="p-4 rounded-2xl bg-surface border border-outline/20 space-y-2">
            <label className="text-xs font-bold text-onSurface flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>คะแนนความมั่นใจ (Confidence Score):</span>
            </label>
            <ConfidenceScoreBar score={log.confidence_score} />
          </div>

          {/* Retrieved Sources */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-onSurface flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span>แหล่งอ้างอิงที่ระบบใช้ตอบ (Retrieved Sources):</span>
            </label>
            {log.sources && log.sources.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {log.sources.map((s, i) => (
                  <RetrievedSourceCard
                    key={s.source_id || i}
                    knowledgeId={s.knowledge_id}
                    title={s.title}
                    contentType={s.content_type}
                    departmentName={s.department_name}
                    relevanceScore={s.relevance_score}
                    rank={s.rank}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-onSurface-muted italic">
                ไม่พบแหล่งอ้างอิงที่มีความเกี่ยวข้องเพียงพอ (Fallback Response)
              </p>
            )}
          </div>

          {/* AI Answer Text */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-onSurface flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-primary" />
              <span>คำตอบที่ระบบสร้างและส่งกลับ (Answer / Fallback):</span>
            </label>
            <div
              className={`p-4 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                log.is_fallback
                  ? 'bg-[#FBE9E7] text-[#B3261E] border border-[#B3261E]/30'
                  : 'bg-surface border border-outline/30 text-onSurface'
              }`}
            >
              {log.answer_text}
            </div>
          </div>

          {/* Feedback & Actions */}
          <div className="pt-3 border-t border-outline/20 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-onSurface">ประเมินคำตอบ:</span>
              <FeedbackBadge
                feedback={currentFeedback}
                interactive={true}
                onSelect={handleFeedback}
              />
            </div>

            <div className="flex items-center gap-2">
              <MarkAsGapButton
                logId={log.log_id}
                isMarked={log.is_marked_gap}
                onSuccess={onMarkGapSuccess}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
