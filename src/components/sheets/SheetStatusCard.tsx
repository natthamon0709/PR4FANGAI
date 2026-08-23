'use client';
import React from 'react';
import Link from 'next/link';
import { SheetSyncConfig } from '@/types/sheets';
import SyncStatusBadge from './SyncStatusBadge';
import { formatThaiRelativeTime } from '@/components/dashboard/RelativeTimeLabel';
import { 
  Users, 
  BookOpen, 
  Building, 
  FolderTree, 
  HelpCircle, 
  Megaphone, 
  Newspaper,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

interface SheetStatusCardProps {
  config: SheetSyncConfig;
  onSyncSingle?: (sheetName: string) => void;
  isAdmin?: boolean;
}

const SHEET_ICONS: Record<string, any> = {
  Master_Users: Users,
  Knowledge_Base: BookOpen,
  Master_Department: Building,
  Master_Section: FolderTree,
  master_users: Users,
  knowledge: BookOpen,
  departments: Building,
  sub_departments: FolderTree,
  faq: HelpCircle,
  announcement: Megaphone,
  news: Newspaper,
};

export default function SheetStatusCard({
  config,
  onSyncSingle,
  isAdmin = true,
}: SheetStatusCardProps) {
  const IconComponent = SHEET_ICONS[config.sheet_name] || BookOpen;

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-surface-card border border-outline/30 shadow-level1 hover:shadow-level2 transition-all flex flex-col justify-between space-y-4 group">
      <div>
        {/* Header: Icon & Badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-primary-container/40 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-105 transition-transform">
            <IconComponent className="w-5 h-5" />
          </div>
          <SyncStatusBadge status={config.status || 'success'} />
        </div>

        {/* Sheet Title */}
        <h4 className="font-heading font-bold text-sm text-onSurface line-clamp-1" title={config.sheet_title_th}>
          {config.sheet_title_th}
        </h4>
        <p className="text-[11px] font-mono text-onSurface-muted mt-0.5">
          แท็บ: {config.sheet_name}
        </p>

        {/* Counts & Status Breakdown */}
        <div className="mt-3 pt-3 border-t border-outline/15 grid grid-cols-2 gap-2 text-xs">
          <div>
            <span className="text-[10px] text-onSurface-muted block">จำนวนข้อมูล</span>
            <span className="font-mono font-bold text-onSurface text-sm">
              {config.total_rows || 0} แถว
            </span>
          </div>

          <div>
            <span className="text-[10px] text-onSurface-muted block">ซิงค์ล่าสุด</span>
            <span className="font-mono text-[11px] text-onSurface-muted">
              {config.last_synced_at ? formatThaiRelativeTime(config.last_synced_at) : 'ยังไม่เคยซิงค์'}
            </span>
          </div>
        </div>

        {/* Warnings / Errors / Conflicts pill if any */}
        {(config.conflict_count || 0) > 0 && (
          <div className="mt-2.5 p-2 rounded-lg bg-[#EDE7F6] text-[#6750A4] text-[11px] font-bold flex items-center justify-between">
            <span>ขัดแย้ง (Conflict)</span>
            <span className="font-mono">{config.conflict_count} รายการ</span>
          </div>
        )}

        {(config.error_count || 0) > 0 && (
          <div className="mt-2.5 p-2 rounded-lg bg-[#FBE9E7] text-[#B3261E] text-[11px] font-bold flex items-center justify-between">
            <span>พบข้อผิดพลาด</span>
            <span className="font-mono">{config.error_count} รายการ</span>
          </div>
        )}

        {(config.pending_count || 0) > 0 && (
          <div className="mt-2.5 p-2 rounded-lg bg-[#FFF4CE] text-[#8B6F2E] text-[11px] font-bold flex items-center justify-between">
            <span>รอการซิงค์</span>
            <span className="font-mono">{config.pending_count} รายการ</span>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="pt-2 border-t border-outline/15 flex items-center justify-between">
        <Link
          href={`/sheets-cms/${config.sheet_name}`}
          className="text-xs font-heading font-semibold text-primary hover:text-primary-dark inline-flex items-center gap-1 group-hover:translate-x-1 transition-all"
        >
          <span>ดูรายละเอียดแถว</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>

        {isAdmin && onSyncSingle && (
          <button
            type="button"
            onClick={() => onSyncSingle(config.sheet_name)}
            className="p-1.5 rounded-lg text-onSurface-muted hover:text-primary hover:bg-surface-variant transition-colors"
            title="สั่งซิงค์เฉพาะแท็บนี้"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
