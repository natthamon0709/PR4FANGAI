import React from 'react';
import Link from 'next/link';
import { AnnouncementItem } from '@/types/dashboard';
import RelativeTimeLabel from './RelativeTimeLabel';
import EmptyStateWidget from './EmptyStateWidget';
import { Bell, ArrowRight, AlertCircle, Info } from 'lucide-react';

interface AnnouncementWidgetProps {
  announcements?: AnnouncementItem[];
  title?: string;
}

export default function AnnouncementWidget({
  announcements = [],
  title = 'ประกาศและข่าวสารวิทยาลัย',
}: AnnouncementWidgetProps) {
  if (!announcements || announcements.length === 0) {
    return (
      <div className="p-5 md:p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-outline/20">
          <h3 className="font-heading font-bold text-sm md:text-base text-onSurface flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <span>{title}</span>
          </h3>
        </div>
        <EmptyStateWidget
          title="ไม่มีประกาศใหม่ในขณะนี้"
          description="ประกาศและคำสั่งสำคัญจากวิทยาลัยจะปรากฏที่นี่"
        />
      </div>
    );
  }

  return (
    <div className="p-5 md:p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-outline/20">
        <h3 className="font-heading font-bold text-sm md:text-base text-onSurface flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          <span>{title}</span>
        </h3>
        <Link
          href="/announcements"
          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
        >
          <span>ดูทั้งหมด</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Items */}
      <div className="divide-y divide-outline/15 my-2 space-y-2">
        {announcements.map((ann) => {
          const isUrgent = ann.priority === 'urgent';
          return (
            <div
              key={ann.announcement_id}
              className={`p-3 rounded-xl border transition-all ${
                isUrgent
                  ? 'bg-error-container/30 border-error/40'
                  : 'bg-surface-variant/30 border-outline/20'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-1.5">
                  {isUrgent ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-error text-white font-bold text-[10px]">
                      <AlertCircle className="w-3 h-3" />
                      <span>สำคัญด่วน</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-container text-primary font-bold text-[10px]">
                      <Info className="w-3 h-3" />
                      <span>ประกาศทั่วไป</span>
                    </span>
                  )}
                  {ann.department_name && (
                    <span className="text-[11px] font-medium text-onSurface-muted">
                      · {ann.department_name}
                    </span>
                  )}
                </div>
                <RelativeTimeLabel dateString={ann.created_at} />
              </div>

              <h4 className="font-bold text-xs md:text-sm text-onSurface leading-snug">
                {ann.title}
              </h4>
              <p className="text-xs text-onSurface-muted line-clamp-2 mt-1 leading-relaxed">
                {ann.content}
              </p>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="pt-2 border-t border-outline/15 text-right">
        <Link
          href="/announcements"
          className="text-xs font-semibold text-primary hover:underline"
        >
          ดูประกาศทั้งหมดของวิทยาลัย →
        </Link>
      </div>
    </div>
  );
}
