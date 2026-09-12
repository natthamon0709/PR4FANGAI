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
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-outline/30">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl md:text-2xl lg:text-3xl font-heading font-extrabold text-onSurface tracking-tight">
            {isAdmin ? (
              <span>ภาพรวมระบบ (System Overview)</span>
            ) : (
              <span>สวัสดี, คุณ{user.first_name} {user.last_name}</span>
            )}
          </h1>
          {isAdmin && (
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 text-[11px] font-mono font-bold border border-amber-500/25 shadow-xs">
              ทุกฝ่าย
            </span>
          )}
        </div>
        <p className="text-xs text-onSurface-muted mt-1">
          {isAdmin ? (
            <span>วิทยาลัยการอาชีพฝาง · ฝ่ายยุทธศาสตร์และแผนงาน (งานศูนย์ดิจิทัลและสื่อสารองค์กร)</span>
          ) : (
            <span>สังกัด: {user.department_name} · {user.sub_department_name}</span>
          )}
        </p>
      </div>

      {/* Right Action: Current Thai date & Manual Cache Refresh button */}
      <div className="flex items-center gap-2.5">
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-surface-card border border-outline/40 text-xs font-mono text-onSurface-variant shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-primary" />
          <span>{thaiDateFormatted}</span>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="h-10 px-4 rounded-xl border border-outline/40 bg-surface-card hover:bg-surface-variant/80 text-xs font-semibold text-onSurface flex items-center gap-2 transition-all duration-150 disabled:opacity-50 shadow-xs active:scale-95"
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
