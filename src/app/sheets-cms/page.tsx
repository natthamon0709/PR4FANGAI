'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import SheetConnectionStatusBar from '@/components/sheets/SheetConnectionStatusBar';
import SheetStatusCard from '@/components/sheets/SheetStatusCard';
import ConflictAlertBanner from '@/components/sheets/ConflictAlertBanner';
import ConflictResolutionModal from '@/components/sheets/ConflictResolutionModal';
import SessionAlert from '@/components/SessionAlert';
import { SessionUser } from '@/types';
import { SheetSyncConfig, SyncConflictItem } from '@/types/sheets';
import { Layers, FileSpreadsheet, UploadCloud, History, Loader2 } from 'lucide-react';

export default function SheetsCMSOverviewPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [configs, setConfigs] = useState<SheetSyncConfig[]>([]);
  const [connectedEmail, setConnectedEmail] = useState('');
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [lastSyncedAt, setLastSyncedAt] = useState('');
  const [conflicts, setConflicts] = useState<SyncConflictItem[]>([]);
  const [totalConflicts, setTotalConflicts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Active conflict modal
  const [activeConflict, setActiveConflict] = useState<SyncConflictItem | null>(null);

  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setCurrentUser(data.user);
      } catch (e) {
        console.error(e);
      }
    }
    loadMeta();
  }, [router]);

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/sheets-cms/status');
      if (res.ok) {
        const data = await res.json();
        setConfigs(data.configs || []);
        setConnectedEmail(data.google_account_email || '');
        setSpreadsheetId(data.spreadsheet_id || '');
        setLastSyncedAt(data.last_synced_at || '');
        setTotalConflicts(data.total_conflicts || 0);
        setConflicts(data.conflicts || []);
      }
    } catch (e: any) {
      setAlertMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadStatus();
    }
  }, [currentUser, loadStatus]);

  const handleSyncAll = async () => {
    try {
      const res = await fetch('/api/sheets-cms/sync-all', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setAlertMsg({ type: 'success', text: data.message });
        loadStatus();
      } else {
        setAlertMsg({ type: 'error', text: data.error });
      }
    } catch (e: any) {
      setAlertMsg({ type: 'error', text: e.message });
    }
  };

  const handleSyncSingle = async (sheetName: string) => {
    try {
      const res = await fetch(`/api/sheets-cms/${sheetName}/sync`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setAlertMsg({ type: 'success', text: data.message });
        loadStatus();
      } else {
        setAlertMsg({ type: 'error', text: data.error });
      }
    } catch (e: any) {
      setAlertMsg({ type: 'error', text: e.message });
    }
  };

  const handleResolveConflict = async (conflictId: string, choice: 'use_db' | 'use_sheet') => {
    try {
      const res = await fetch(`/api/sheets-cms/conflicts/${conflictId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choice }),
      });
      const data = await res.json();
      if (res.ok) {
        setAlertMsg({ type: 'success', text: data.message });
        loadStatus();
      } else {
        setAlertMsg({ type: 'error', text: data.error });
      }
    } catch (e: any) {
      setAlertMsg({ type: 'error', text: e.message });
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const isAdmin = currentUser.role === 'administrator';

  return (
    <DashboardLayout
      user={currentUser}
      breadcrumbs={[{ label: 'Google Sheets CMS' }]}
    >
      <div className="space-y-6 animate-fadeIn">
        {/* Header Title & Nav Links */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline/20">
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-extrabold text-onSurface flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-[#0F9D58]" />
              <span>Google Sheets CMS (ศูนย์ควบคุมการซิงค์ข้อมูล)</span>
            </h1>
            <p className="text-xs text-onSurface-muted mt-0.5">
              ระบบเชื่อมต่อแบบสองทาง (Two-way Sync) ระหว่างฐานข้อมูลหลักกับ Google Sheets ทั้ง 7 ชีท
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/sheets-cms/logs"
              className="h-10 px-3.5 rounded-xl border border-outline bg-surface-card hover:bg-surface-variant text-xs font-semibold text-onSurface flex items-center gap-1.5 transition-colors shadow-sm"
              title="ดูประวัติการซิงค์ย้อนหลัง"
            >
              <History className="w-4 h-4 text-onSurface-muted" />
              <span>ประวัติการซิงค์</span>
            </Link>

            {isAdmin && (
              <Link
                href="/sheets-cms/import"
                className="h-10 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-heading font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all"
              >
                <UploadCloud className="w-4 h-4" />
                <span>นำเข้าข้อมูลจำนวนมาก</span>
              </Link>
            )}
          </div>
        </div>

        {alertMsg && (
          <SessionAlert
            type={alertMsg.type}
            message={alertMsg.text}
            onClose={() => setAlertMsg(null)}
          />
        )}

        {/* 1. Connection Status Bar (C47) */}
        <SheetConnectionStatusBar
          connected={true}
          googleAccountEmail={connectedEmail}
          spreadsheetId={spreadsheetId}
          lastSyncedAt={lastSyncedAt}
          onSyncAll={handleSyncAll}
          isAdmin={isAdmin}
        />

        {/* 2. Conflict Alert Banner (C49) */}
        <ConflictAlertBanner
          conflictCount={totalConflicts}
          onOpenModal={() => setActiveConflict(conflicts[0] || null)}
        />

        {/* 3. 7 Sheet Status Cards Grid (C48) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-heading font-bold text-onSurface flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span>สถานะการซิงค์รายชีท ({configs.length} Google Sheets Tabs)</span>
            </h3>
            <span className="text-xs text-onSurface-muted font-mono">
              Spreadsheet ID: {spreadsheetId.substring(0, 12)}...
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {configs.map((cfg) => (
              <SheetStatusCard
                key={cfg.config_id}
                config={cfg}
                onSyncSingle={handleSyncSingle}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        </div>

        {/* Conflict Resolution Modal (C53) */}
        <ConflictResolutionModal
          isOpen={Boolean(activeConflict)}
          onClose={() => setActiveConflict(null)}
          conflict={activeConflict}
          onResolve={handleResolveConflict}
        />
      </div>
    </DashboardLayout>
  );
}
