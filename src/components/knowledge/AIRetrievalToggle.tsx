import React from 'react';
import { Bot, Sparkles, AlertCircle } from 'lucide-react';

interface AIRetrievalToggleProps {
  enabled: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}

export default function AIRetrievalToggle({
  enabled,
  onChange,
  disabled = false,
}: AIRetrievalToggleProps) {
  return (
    <div className={`p-4 rounded-xl border transition-all ${
      enabled
        ? 'bg-primary-container/30 border-primary/40'
        : 'bg-surface-variant/40 border-outline/30'
    }`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
            enabled ? 'bg-primary text-white' : 'bg-surface-variant text-onSurface-muted'
          }`}>
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-heading font-bold text-onSurface">
                การนำไปใช้ตอบคำถามด้วย AI (AI Retrieval)
              </h4>
              {enabled && (
                <span className="px-1.5 py-0.2 rounded-full bg-secondary-container text-secondary-dark text-[10px] font-bold">
                  เปิดใช้งาน
                </span>
              )}
            </div>
            <p className="text-[11px] text-onSurface-muted mt-0.5 leading-relaxed">
              {enabled
                ? 'อนุญาตให้ Phase 5 (AI Processing Engine) ค้นหาและดึงเนื้อหานี้ไปตอบคำถามผ่าน LINE OA'
                : 'ปิดไม่ให้ AI ใช้ข้อมูลนี้ตอบคำถาม (เหมาะสำหรับเอกสารร่างหรือระเบียบภายใน)'}
            </p>
          </div>
        </div>

        {/* Switch toggle */}
        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-surface-variant peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-outline/30 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
      </div>
    </div>
  );
}
