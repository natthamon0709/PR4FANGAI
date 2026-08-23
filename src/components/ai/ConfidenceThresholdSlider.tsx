'use client';
import React from 'react';
import { ShieldCheck, Info } from 'lucide-react';
import { getConfidenceLevel } from './ConfidenceScoreBar';

interface ConfidenceThresholdSliderProps {
  value: number; // 0.00 - 1.00
  onChange: (val: number) => void;
  disabled?: boolean;
}

export default function ConfidenceThresholdSlider({
  value,
  onChange,
  disabled = false
}: ConfidenceThresholdSliderProps) {
  const percent = Math.round(value * 100);
  const info = getConfidenceLevel(value);

  return (
    <div className="p-4 rounded-2xl bg-surface-card border border-outline/30 shadow-level1 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <label className="text-xs font-bold text-onSurface flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>เกณฑ์ความมั่นใจขั้นต่ำ (Confidence Threshold)</span>
          </label>
          <p className="text-[11px] text-onSurface-muted mt-0.5">
            หากคะแนนความเกี่ยวข้องต่ำกว่าค่านี้ ระบบจะตอบด้วยข้อความ Fallback และบันทึกเป็น Knowledge Gap
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono font-extrabold text-base text-primary bg-primary-container/40 px-2.5 py-1 rounded-xl border border-primary/20">
            {value.toFixed(2)} ({percent}%)
          </span>
        </div>
      </div>

      {/* Slider with visible thumb value */}
      <div className="relative pt-1">
        <input
          type="range"
          min="0.00"
          max="1.00"
          step="0.01"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-surface-variant rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50"
        />
        <div className="flex justify-between text-[10px] font-mono text-onSurface-muted mt-1 px-1">
          <span>0.00 (เปิดกว้าง)</span>
          <span className="font-semibold text-primary">0.70 (แนะนำ)</span>
          <span>1.00 (เข้มงวดสูงสุด)</span>
        </div>
      </div>

      <div className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 ${info.badgeBg}`}>
        <Info className="w-3.5 h-3.5 flex-shrink-0" />
        <span>
          {value >= 0.75 ? 'ความเข้มงวดสูง: AI จะตอบเฉพาะเมื่อพบเอกสารที่ตรงกันอย่างชัดเจนมาก' : value >= 0.50 ? 'สมดุลมาตรฐาน: ตอบคำถามเมื่อมีเนื้อหาที่เกี่ยวข้องเพียงพอ' : 'เปิดกว้างมาก: อาจตอบคำถามแม้เนื้อหาจะมีความเกี่ยวข้องน้อย'}
        </span>
      </div>
    </div>
  );
}
