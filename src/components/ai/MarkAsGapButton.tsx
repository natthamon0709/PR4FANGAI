'use client';
import React, { useState } from 'react';
import { AlertCircle, Check, Loader2 } from 'lucide-react';

interface MarkAsGapButtonProps {
  logId: string;
  isMarked?: boolean;
  onSuccess?: () => void;
  size?: 'sm' | 'md';
}

export default function MarkAsGapButton({
  logId,
  isMarked = false,
  onSuccess,
  size = 'md'
}: MarkAsGapButtonProps) {
  const [marked, setMarked] = useState(isMarked);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMark = async () => {
    if (marked || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ai-engine/logs/${logId}/mark-gap`, {
        method: 'POST'
      });
      const data = await res.json();
      if (res.ok) {
        setMarked(true);
        onSuccess?.();
      } else {
        setError(data.error || 'Failed to mark gap');
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (marked) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#8B6F2E] bg-[#FFF8E1] px-2 py-1 rounded-lg border border-[#8B6F2E]/30">
        <Check className="w-3.5 h-3.5" />
        <span>บันทึกเป็น Gap แล้ว</span>
      </span>
    );
  }

  const paddingClass = size === 'sm' ? 'px-2 py-1 text-[11px]' : 'px-3 py-1.5 text-xs';

  return (
    <div className="inline-flex flex-col items-end">
      <button
        type="button"
        onClick={handleMark}
        disabled={loading}
        className={`inline-flex items-center gap-1.5 rounded-xl border border-outline bg-surface-card hover:bg-surface-variant text-onSurface font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50 ${paddingClass}`}
        title="บันทึกคำถามนี้เป็น Knowledge Gap เพื่อให้ฝ่ายที่เกี่ยวข้องเพิ่มองค์ความรู้"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
        ) : (
          <AlertCircle className="w-3.5 h-3.5 text-[#8B6F2E]" />
        )}
        <span>Mark as Gap</span>
      </button>
      {error && <span className="text-[10px] text-error mt-0.5">{error}</span>}
    </div>
  );
}
