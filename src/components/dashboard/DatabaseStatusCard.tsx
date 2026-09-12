import React from 'react';
import Link from 'next/link';
import { Database, CheckCircle2, ShieldCheck, HardDrive, ArrowRight } from 'lucide-react';
import { formatThaiRelativeTime } from './RelativeTimeLabel';
import { DatabaseStatusInfo } from '@/types/dashboard';

interface DatabaseStatusCardProps {
  dbStatus?: DatabaseStatusInfo;
  lastChecked?: string;
}

export default function DatabaseStatusCard({
  dbStatus,
  lastChecked,
}: DatabaseStatusCardProps) {
  const isHealthy = dbStatus?.status !== 'error';
  const checkedAt = dbStatus?.last_checked || lastChecked || new Date().toISOString();

  return (
    <div className="p-5 rounded-2xl bg-surface-card border border-outline/40 shadow-card space-y-3.5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-xs bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-heading font-bold text-onSurface flex items-center gap-1.5">
              <span>ฐานข้อมูลหลัก (Direct DB)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h4>
            <p className="text-[11px] text-onSurface-muted font-mono">
              {dbStatus?.engine || 'SQLite 3'} · {dbStatus?.mode || 'Local WAL'}
            </p>
          </div>
        </div>

        <Link
          href="/integrations"
          className="p-1.5 rounded-xl text-onSurface-muted hover:text-primary hover:bg-surface-variant/80 transition-colors"
          title="ดูการเชื่อมต่อฐานข้อมูล"
        >
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-2 py-1 text-center font-mono text-xs">
        <div className="p-2 rounded-lg bg-surface-variant/40 border border-outline/20">
          <div className="text-[10px] text-onSurface-muted font-sans">ผู้ใช้งาน</div>
          <div className="font-bold text-onSurface">{dbStatus?.total_users ?? '-'}</div>
        </div>
        <div className="p-2 rounded-lg bg-surface-variant/40 border border-outline/20">
          <div className="text-[10px] text-onSurface-muted font-sans">องค์ความรู้</div>
          <div className="font-bold text-onSurface">{dbStatus?.total_knowledge ?? '-'}</div>
        </div>
        <div className="p-2 rounded-lg bg-surface-variant/40 border border-outline/20">
          <div className="text-[10px] text-onSurface-muted font-sans">AI Logs</div>
          <div className="font-bold text-onSurface">{dbStatus?.total_logs ?? '-'}</div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-outline/30 text-xs">
        <div className="flex items-center gap-1.5 text-onSurface-muted text-[11px]">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Single Source of Truth (เชื่อมต่อสมบูรณ์)</span>
        </div>
        <span className="text-[10px] text-onSurface-muted/80 font-mono">
          {formatThaiRelativeTime(checkedAt)}
        </span>
      </div>
    </div>
  );
}
