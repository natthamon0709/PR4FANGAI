'use client';
import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle, Database, Settings, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { formatThaiRelativeTime } from '@/components/dashboard/RelativeTimeLabel';
import OpenInSheetsButton from './OpenInSheetsButton';

interface SheetConnectionStatusBarProps {
  connected: boolean;
  googleAccountEmail: string;
  spreadsheetId: string;
  lastSyncedAt: string;
  onSyncAll: () => Promise<void>;
  isAdmin?: boolean;
}

export default function SheetConnectionStatusBar({
  connected = true,
  googleAccountEmail,
  spreadsheetId,
  lastSyncedAt,
  onSyncAll,
  isAdmin = true,
}: SheetConnectionStatusBarProps) {
  const [syncing, setSyncing] = useState(false);

  const handleSyncClick = async () => {
    setSyncing(true);
    try {
      await onSyncAll();
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-surface-card border border-outline/30 shadow-level1 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left: Connection Info */}
      <div className="flex items-start sm:items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-[#E5F4EA] border border-[#0F9D58]/30 flex items-center justify-center flex-shrink-0 shadow-sm">
          <svg className="w-6 h-6 text-[#0F9D58]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
            <path d="M7 7h10v2H7zm0 4h10v2H7zm0 4h7v2H7z"/>
          </svg>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-heading font-extrabold text-onSurface">
              Google Sheets Master CMS (Two-way Sync)
            </h3>
            {connected ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E4F2E4] text-[#2E7D32] text-[11px] font-bold border border-[#2E7D32]/30">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2E7D32] animate-pulse" />
                <span>เชื่อมต่ออยู่</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-error-container text-error text-[11px] font-bold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>ขาดการเชื่อมต่อ</span>
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-onSurface-muted mt-1">
            <span>บัญชี: <strong className="text-onSurface font-mono">{googleAccountEmail}</strong></span>
            <span>·</span>
            <span>ซิงค์ล่าสุด: <strong className="text-onSurface">{formatThaiRelativeTime(lastSyncedAt)}</strong></span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex flex-wrap items-center gap-2.5 self-start md:self-center">
        <OpenInSheetsButton sheetId={spreadsheetId} />

        {isAdmin && (
          <>
            <Link
              href="/sheets-cms/connection"
              className="h-10 px-3.5 rounded-xl border border-outline bg-surface-card hover:bg-surface-variant text-xs font-semibold text-onSurface flex items-center gap-1.5 transition-colors shadow-sm"
              title="ตั้งค่าการเชื่อมต่อและ Field Mapping"
            >
              <Settings className="w-4 h-4 text-onSurface-muted" />
              <span className="hidden sm:inline">ตั้งค่าเชื่อมต่อ</span>
            </Link>

            <button
              type="button"
              disabled={syncing}
              onClick={handleSyncClick}
              className="h-10 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-heading font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-60"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'กำลังซิงค์ข้อมูล...' : 'ซิงค์ทั้งหมดตอนนี้'}</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
