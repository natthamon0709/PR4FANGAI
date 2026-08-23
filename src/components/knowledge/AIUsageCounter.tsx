import React from 'react';
import { Bot, Sparkles, TrendingUp } from 'lucide-react';

interface AIUsageCounterProps {
  count: number;
  className?: string;
}

export default function AIUsageCounter({ count = 0, className = '' }: AIUsageCounterProps) {
  return (
    <div className={`p-4 rounded-2xl bg-gradient-to-br from-primary-container/40 to-surface-card border border-primary/20 shadow-level1 flex items-center justify-between gap-3 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-sm flex-shrink-0">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-heading font-bold text-onSurface">
              สถิติการนำไปใช้อ้างอิงโดย AI
            </span>
            <Sparkles className="w-3 h-3 text-secondary" />
          </div>
          <p className="text-[11px] text-onSurface-muted mt-0.5">
            ถูก Phase 5 (LINE OA AI Agent) ดึงไปตอบคำถามบุคลากรและนักศึกษา
          </p>
        </div>
      </div>

      <div className="text-right flex-shrink-0">
        <div className="text-2xl font-extrabold font-heading text-primary tracking-tight">
          {count.toLocaleString('th-TH')}
        </div>
        <span className="text-[10px] text-onSurface-muted font-medium">ครั้งที่ตอบสำเร็จ</span>
      </div>
    </div>
  );
}
