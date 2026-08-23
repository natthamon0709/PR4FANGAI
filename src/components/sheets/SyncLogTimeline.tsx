import React from 'react';
import { SyncLogItem } from '@/types/sheets';
import SyncStatusBadge from './SyncStatusBadge';
import { formatThaiRelativeTime } from '@/components/dashboard/RelativeTimeLabel';
import { ArrowDownLeft, ArrowUpRight, History } from 'lucide-react';

interface SyncLogTimelineProps {
  logs: SyncLogItem[];
}

export default function SyncLogTimeline({ logs = [] }: SyncLogTimelineProps) {
  if (logs.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-onSurface-muted bg-surface-card rounded-2xl border border-outline/30">
        ยังไม่มีประวัติการซิงค์ข้อมูล
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => {
        const isToDb = log.direction === 'sheet_to_db';

        return (
          <div
            key={log.log_id}
            className="p-4 rounded-xl bg-surface-card border border-outline/30 shadow-sm flex items-start justify-between gap-3 text-xs"
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                isToDb ? 'bg-primary-container text-primary' : 'bg-[#E5F4EA] text-[#0F9D58]'
              }`}>
                {isToDb ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-onSurface">
                    {log.row_reference}
                  </span>
                  <span className="px-2 py-0.2 rounded-full bg-surface-variant font-mono text-[10px] text-onSurface-muted">
                    {log.sheet_name}
                  </span>
                </div>

                <div className="text-[11px] text-onSurface-muted flex items-center gap-2">
                  <span>ทิศทาง: {isToDb ? 'Sheet ➔ Database' : 'Database ➔ Sheet'}</span>
                  <span>·</span>
                  <span>{formatThaiRelativeTime(log.synced_at)}</span>
                </div>

                {log.error_message && (
                  <p className="text-xs text-error font-medium mt-1">
                    ⚠️ {log.error_message}
                  </p>
                )}
              </div>
            </div>

            <SyncStatusBadge status={log.status as any} />
          </div>
        );
      })}
    </div>
  );
}
