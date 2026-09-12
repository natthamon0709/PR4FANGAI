import React from 'react';
import Link from 'next/link';
import { RecentActivityItem } from '@/types/dashboard';
import RelativeTimeLabel from './RelativeTimeLabel';
import EmptyStateWidget from './EmptyStateWidget';
import { BookOpen, ArrowRight, User, Sparkles } from 'lucide-react';

interface RecentKnowledgeListProps {
  activities?: RecentActivityItem[];
  title?: string;
  viewAllHref?: string;
}

export default function RecentKnowledgeList({
  activities = [],
  title = 'องค์ความรู้อัปเดตล่าสุด',
  viewAllHref = '/knowledge',
}: RecentKnowledgeListProps) {
  if (!activities || activities.length === 0) {
    return (
      <div className="p-5 md:p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-outline/20">
          <h3 className="font-heading font-bold text-sm md:text-base text-onSurface flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <span>{title}</span>
          </h3>
        </div>
        <EmptyStateWidget
          title="ยังไม่มีองค์ความรู้ในระบบ"
          description="เริ่มต้นสร้างองค์ความรู้แรกของฝ่ายได้ทันที"
          actionText="เพิ่มองค์ความรู้"
          actionHref="/knowledge/new"
        />
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 bg-surface-card rounded-2xl border border-outline/40 shadow-card flex flex-col justify-between h-full">
      {/* Header with View All Link */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-outline/30">
        <h3 className="font-heading font-bold text-sm md:text-base text-onSurface flex items-center gap-2">
          <span className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
            <BookOpen className="w-4 h-4" />
          </span>
          <span>{title}</span>
        </h3>
        <Link
          href={viewAllHref}
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 group"
        >
          <span>ดูทั้งหมด</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* List items */}
      <div className="divide-y divide-outline/25 my-2">
        {activities.map((act) => {
          const isCreate = act.action_type === 'create';
          return (
            <div
              key={act.activity_id}
              className="py-3 flex items-start justify-between gap-3 hover:bg-surface-variant/50 rounded-xl px-2.5 -mx-2.5 transition-colors group"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <Link
                  href={`/knowledge/${act.target_id || ''}`}
                  className="font-semibold text-xs md:text-sm text-onSurface hover:text-primary hover:underline truncate block"
                >
                  {act.title_snapshot}
                </Link>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-onSurface-muted">
                  <span className="px-2 py-0.5 rounded-md bg-surface-variant text-onSurface-variant font-medium text-[10px]">
                    {act.department_name ? act.department_name.replace('ฝ่าย', '') : 'วิทยาลัย'}
                  </span>
                  <span className="flex items-center gap-1 text-[11px]">
                    <User className="w-3 h-3 text-onSurface-muted/70" />
                    <span>{act.actor_name}</span>
                  </span>
                </div>
              </div>

              {/* Relative Time */}
              <div className="flex-shrink-0 text-right space-y-1">
                <RelativeTimeLabel dateString={act.created_at} />
                <span className={`inline-block text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                  isCreate
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                }`}>
                  {isCreate ? '+ เพิ่มใหม่' : '✎ แก้ไข'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Link */}
      <div className="pt-3 border-t border-outline/30 text-right">
        <Link
          href={viewAllHref}
          className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
        >
          <span>เปิดดูคลังองค์ความรู้ทั้งหมด ({activities.length}+ รายการ) →</span>
        </Link>
      </div>
    </div>
  );
}
