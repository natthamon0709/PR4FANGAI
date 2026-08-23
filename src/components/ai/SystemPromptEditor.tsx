'use client';
import React from 'react';
import { MessageSquareCode, Sparkles } from 'lucide-react';

interface SystemPromptEditorProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  maxLength?: number;
}

export default function SystemPromptEditor({
  value,
  onChange,
  disabled = false,
  maxLength = 4000
}: SystemPromptEditorProps) {
  const currentLength = value.length;
  const isNearLimit = currentLength > maxLength * 0.9;

  const handleResetDefault = () => {
    onChange(
      'คุณคือผู้ช่วย AI อัจฉริยะประจำวิทยาลัยการอาชีพฝาง ให้ตอบคำถามอย่างสุภาพ ถูกต้อง กระชับ และอ้างอิงจากข้อมูลองค์ความรู้ที่ได้รับเท่านั้น ห้ามคาดเดาข้อมูลที่ไม่ปรากฏในเอกสาร หากไม่พบข้อมูล ให้แนะนำช่องทางติดต่อฝ่ายงานที่เกี่ยวข้องอย่างชัดเจน'
    );
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-onSurface flex items-center gap-1.5">
          <MessageSquareCode className="w-3.5 h-3.5 text-primary" />
          <span>System Prompt (คำสั่งกำหนดบทบาทและบุคลิกภาพ AI)</span>
        </label>
        <button
          type="button"
          onClick={handleResetDefault}
          disabled={disabled}
          className="text-[11px] text-primary hover:underline inline-flex items-center gap-1"
        >
          <Sparkles className="w-3 h-3" />
          <span>คืนค่าเริ่มต้น</span>
        </button>
      </div>

      <div className="relative">
        <textarea
          rows={5}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          maxLength={maxLength}
          placeholder="ระบุคำสั่งควบคุมพฤติกรรม เช่น ข้อห้ามในการคาดเดา, โทนการตอบ, ช่องทางติดต่อ..."
          className="w-full p-3.5 rounded-2xl border border-outline bg-surface text-xs md:text-sm text-onSurface leading-relaxed outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm resize-y font-sans transition-all disabled:opacity-60"
        />
        <div className="flex justify-end pr-2 pt-0.5">
          <span
            className={`text-[11px] font-mono ${
              isNearLimit ? 'text-error font-bold' : 'text-onSurface-muted'
            }`}
          >
            {currentLength.toLocaleString()} / {maxLength.toLocaleString()} ตัวอักษร
          </span>
        </div>
      </div>
    </div>
  );
}
