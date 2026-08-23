'use client';
import React from 'react';
import { ThumbsUp, ThumbsDown, Minus } from 'lucide-react';
import { FeedbackType } from '@/types/ai';

interface FeedbackBadgeProps {
  feedback: FeedbackType;
  interactive?: boolean;
  onSelect?: (val: FeedbackType) => void;
}

export default function FeedbackBadge({
  feedback,
  interactive = false,
  onSelect
}: FeedbackBadgeProps) {
  if (interactive) {
    return (
      <div className="inline-flex items-center gap-1 bg-surface-variant/40 p-1 rounded-xl border border-outline/20">
        <button
          type="button"
          onClick={() => onSelect?.('helpful')}
          className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold ${
            feedback === 'helpful'
              ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/30 shadow-sm'
              : 'text-onSurface-muted hover:text-onSurface hover:bg-surface'
          }`}
          title="คำตอบนี้มีประโยชน์ (Helpful)"
        >
          <ThumbsUp className="w-3.5 h-3.5" />
          <span>มีประโยชน์</span>
        </button>

        <button
          type="button"
          onClick={() => onSelect?.('not_helpful')}
          className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold ${
            feedback === 'not_helpful'
              ? 'bg-[#FBE9E7] text-[#B3261E] border border-[#B3261E]/30 shadow-sm'
              : 'text-onSurface-muted hover:text-onSurface hover:bg-surface'
          }`}
          title="คำตอบนี้ต้องปรับปรุง (Not Helpful)"
        >
          <ThumbsDown className="w-3.5 h-3.5" />
          <span>ไม่ตรงคำถาม</span>
        </button>
      </div>
    );
  }

  if (feedback === 'helpful') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/30 text-xs font-bold font-mono">
        <ThumbsUp className="w-3 h-3" />
        <span>ได้ผลดี</span>
      </span>
    );
  }

  if (feedback === 'not_helpful') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FBE9E7] text-[#B3261E] border border-[#B3261E]/30 text-xs font-bold font-mono">
        <ThumbsDown className="w-3 h-3" />
        <span>ต้องปรับปรุง</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-surface-variant/60 text-onSurface-muted text-xs font-mono">
      <Minus className="w-3 h-3" />
      <span>ไม่มีประเมิน</span>
    </span>
  );
}
