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
    <div className="p-5 md:p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-outline/20">
        <div>
          <h3 className="font-heading font-bold text-sm md:text-base text-onSurface flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-error" />
            <span>{title}</span>
          </h3>
          <p className="text-[11px] text-onSurface-muted mt-0.5">
            ประเด็นที่ถูกถามบ่อยแต่ยังไม่มีองค์ความรู้รองรับ (กระตุ้นการเพิ่มข้อมูล)
          </p>
        </div>
        <Link
          href="/ai-logs?filter=unanswered"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 flex-shrink-0"
        >
          <span>ดูทั้งหมด</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Gap items */}
      <div className="divide-y divide-outline/15 my-2">
        {gaps.map((gap) => (
          <div
            key={gap.gap_id}
            className="py-3 flex items-start justify-between gap-3 hover:bg-error-container/20 rounded-lg px-2 -mx-2 transition-colors group"
          >
            <div className="space-y-1 min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-error-container text-error font-bold text-[10px] flex-shrink-0">
                  ถาม {gap.ask_count} ครั้ง
                </span>
                <p className="font-medium text-xs md:text-sm text-onSurface truncate">
                  "{gap.question_text}"
                </p>
              </div>

              <div className="flex items-center gap-3 text-[11px] text-onSurface-muted pl-1">
                {gap.department_name && (
                  <span className="text-secondary-dark font-medium">
                    {gap.department_name}
                  </span>
                )}
                <RelativeTimeLabel dateString={gap.last_asked_at} />
              </div>
            </div>

            {/* Quick Action Button: Add knowledge with pre-filled question */}
            <Link
              href={`/knowledge/new?title=${encodeURIComponent(gap.question_text)}`}
              className="flex-shrink-0 p-1.5 rounded-lg border border-primary/40 bg-primary-container/40 hover:bg-primary hover:text-white text-primary text-xs font-semibold flex items-center gap-1 transition-all"
              title="สร้างองค์ความรู้เพื่อตอบคำถามนี้"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ตอบคำถามนี้</span>
            </Link>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-outline/15 flex items-center justify-between text-xs text-onSurface-muted">
        <span>เพิ่มองค์ความรู้ช่วยเพิ่มความแม่นยำ AI</span>
        <Link
          href="/ai-logs?filter=unanswered"
          className="font-semibold text-primary hover:underline"
        >
          ตรวจสอบทั้งหมด →
        </Link>
      </div>
    </div>
  );
}
