import React from 'react';
import Link from 'next/link';
import { FileSpreadsheet, ExternalLink, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { formatThaiRelativeTime } from './RelativeTimeLabel';

interface SheetSyncStatusCardProps {
  pendingCount: number;
  lastSynced?: string;
  sheetUrl?: string;
  onSyncNow?: () => void;
  syncing?: boolean;
}

export default function SheetSyncStatusCard({
  pendingCount,
  lastSynced,
  sheetUrl = 'https://docs.google.com/spreadsheets/d/1-zp32f6bkCcXpGo5O__moHCAXcm_Sjg0rTPRkTK6fYs/edit?gid=547794364#gid=547794364',
  onSyncNow,
  syncing = false,
}: SheetSyncStatusCardProps) {
  const isAllSynced = pendingCount === 0;

  return (
    <div className="p-5 rounded-2xl bg-surface-card border border-outline/30 shadow-level1 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isAllSynced ? 'bg-success-container text-success' : 'bg-secondary-container text-secondary-dark'
          }`}>
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-heading font-bold text-onSurface">
              Google Sheets Master CMS
            </h4>
            <p className="text-[11px] text-onSurface-muted">
              {isAllSynced ? 'ซิงค์ข้อมูลเรียบร้อยแล้ว' : `มี ${pendingCount} รายการรอการซิงค์`}
            </p>
          </div>
        </div>

        <a
          href={sheetUrl}
          target="_blank"
          rel="noreferrer"
          className="p-1.5 rounded-lg text-onSurface-muted hover:text-primary hover:bg-surface-variant transition-colors"
          title="เปิด Google Sheets"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-outline/20 text-xs">
        <div className="flex items-center gap-1.5 text-onSurface-muted text-[11px]">
          {isAllSynced ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-secondary-dark" />
          )}
          <span>ซิงค์ล่าสุด: {lastSynced ? formatThaiRelativeTime(lastSynced) : '-'}</span>
        </div>

        <Link
          href="/integrations"
          className="text-xs font-semibold text-primary hover:underline"
        >
          จัดการ Sync →
        </Link>
      </div>
    </div>
  );
}
