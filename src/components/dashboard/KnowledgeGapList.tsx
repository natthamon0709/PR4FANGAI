import React from 'react';
import Link from 'next/link';
import { KnowledgeGapItem } from '@/types/dashboard';
import RelativeTimeLabel from './RelativeTimeLabel';
import EmptyStateWidget from './EmptyStateWidget';
import { HelpCircle, ArrowRight, PlusCircle, AlertTriangle, Sparkles } from 'lucide-react';

interface KnowledgeGapListProps {
  gaps?: KnowledgeGapItem[];
  title?: string;
}

export default function KnowledgeGapList({
  gaps = [],
  title = 'คำถามที่ AI ตอบไม่ได้ (Knowledge Gap)',
}: KnowledgeGapListProps) {
  if (!gaps || gaps.length === 0) {
    return (
      <div className="p-5 md:p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-outline/20">
          <h3 className="font-heading font-bold text-sm md:text-base text-onSurface flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-error" />
            <span>{title}</span>
          </h3>
        </div>
        <EmptyStateWidget
          title="ยอดเยี่ยม! ไม่มีคำถามที่ AI ตอบไม่ได้"
          description="องค์ความรู้ในระบบครอบคลุมคำถามของผู้ใช้งานและนักศึกษาอย่างสมบูรณ์"
        />
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 bg-surface-card rounded-2xl border border-outline/40 shadow-card flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-outline/30">
        <div>
          <h3 className="font-heading font-bold text-sm md:text-base text-onSurface flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-red-500/10 text-red-600 flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <span>{title}</span>
          </h3>
          <p className="text-[11px] text-onSurface-muted mt-0.5 pl-9">
            ประเด็นที่ถูกถามบ่อยแต่ยังไม่มีองค์ความรู้รองรับ (กระตุ้นการเพิ่มข้อมูล)
          </p>
        </div>
        <Link
          href="/ai-logs?filter=unanswered"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 flex-shrink-0 group"
        >
          <span>ดูทั้งหมด</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Gap items */}
      <div className="divide-y divide-outline/25 my-2">
        {gaps.map((gap) => (
          <div
            key={gap.gap_id}
            className="py-3 flex items-start justify-between gap-3 hover:bg-rose-50/50 rounded-xl px-2.5 -mx-2.5 transition-colors group"
          >
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-rose-100/80 text-rose-700 font-mono font-bold text-[10px] flex-shrink-0 border border-rose-200/60">
                  ถาม {gap.ask_count} ครั้ง
                </span>
                <p className="font-semibold text-xs md:text-sm text-onSurface truncate">
                  "{gap.question_text}"
                </p>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-onSurface-muted pl-1">
                {gap.department_name && (
                  <span className="text-amber-700 font-medium text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10">
                    {gap.department_name}
                  </span>
                )}
                <RelativeTimeLabel dateString={gap.last_asked_at} />
              </div>
            </div>

            {/* Quick Action Button: Add knowledge with pre-filled question */}
            <Link
              href={`/knowledge/new?title=${encodeURIComponent(gap.question_text)}`}
              className="flex-shrink-0 px-2.5 py-1.5 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary hover:text-white text-primary text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
              title="สร้างองค์ความรู้เพื่อตอบคำถามนี้"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ตอบคำถามนี้</span>
            </Link>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-outline/30 flex items-center justify-between text-xs text-onSurface-muted">
        <span className="text-[11px]">เพิ่มองค์ความรู้ช่วยเพิ่มความแม่นยำ AI</span>
        <Link
          href="/ai-logs?filter=unanswered"
          className="font-semibold text-primary hover:underline inline-flex items-center gap-1"
        >
          <span>ตรวจสอบทั้งหมด →</span>
        </Link>
      </div>
    </div>
  );
}
