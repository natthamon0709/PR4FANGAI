import React from 'react';
import { SessionUser } from '@/types';
import { RefreshCw, Calendar, Sparkles } from 'lucide-react';
import { formatThaiRelativeTime } from './RelativeTimeLabel';

interface DashboardHeaderProps {
  user: SessionUser;
  calculatedAt?: string;
  isCached?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export default function DashboardHeader({
  user,
  calculatedAt,
  isCached = false,
  onRefresh,
  refreshing = false,
}: DashboardHeaderProps) {
  const isAdmin = user.role === 'administrator';

  // Thai Date formatting: e.g. 8 ส.ค. 2569
  const today = new Date();
  const thaiDateFormatted = today.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-outline/20">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl md:text-2xl font-heading font-extrabold text-onSurface tracking-tight">
            {isAdmin ? (
              <span>ภาพรวมระบบ (System Overview)</span>
            ) : (
              <span>สวัสดี, คุณ{user.first_name} {user.last_name}</span>
            )}
          </h1>
          {isAdmin && (
            <span className="px-2 py-0.5 rounded-full bg-secondary-container text-secondary-dark text-[11px] font-bold border border-secondary/30">
              ทุกฝ่าย
            </span>
          )}
        </div>
        <p className="text-xs text-onSurface-muted mt-0.5">
          {isAdmin ? (
            <span>วิทยาลัยการอาชีพฝาง · ฝ่ายยุทธศาสตร์และแผนงาน (งานศูนย์ดิจิทัลและสื่อสารองค์กร)</span>
          ) : (
            <span>สังกัด: {user.department_name} · {user.sub_department_name}</span>
          )}
        </p>
      </div>

      {/* Right Action: Current Thai date & Manual Cache Refresh button */}
      <div className="flex items-center gap-2.5">
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-card border border-outline/30 text-xs font-mono text-onSurface-variant">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <span>{thaiDateFormatted}</span>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="h-9 px-3.5 rounded-lg border border-outline bg-surface-card hover:bg-surface-variant text-xs font-medium text-onSurface flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
            title="รีเฟรชข้อมูลสรุปภาพรวมแดชบอร์ด"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-primary ${refreshing ? 'animate-spin' : ''}`} />
            <span>รีเฟรชข้อมูล</span>
          </button>
        )}
      </div>
    </div>
  );
}
