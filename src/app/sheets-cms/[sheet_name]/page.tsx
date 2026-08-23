'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import SheetRowTable from '@/components/sheets/SheetRowTable';
import OpenInSheetsButton from '@/components/sheets/OpenInSheetsButton';
import ConflictResolutionModal from '@/components/sheets/ConflictResolutionModal';
import SessionAlert from '@/components/SessionAlert';
import { SessionUser } from '@/types';
import { SheetRowItem, SheetSyncConfig, SyncConflictItem } from '@/types/sheets';
import { ArrowLeft, Search, RefreshCw, Layers, Loader2 } from 'lucide-react';

export default function SheetRowDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sheetName = params.sheet_name as string;

  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [sheetConfig, setSheetConfig] = useState<SheetSyncConfig | null>(null);
  const [rows, setRows] = useState<SheetRowItem[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Active Conflict Modal
  const [activeConflict, setActiveConflict] = useState<SyncConflictItem | null>(null);

  useEffect(() => {
    async function loadUser() {
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
    loadUser();
  }, [router]);

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'all') queryParams.set('status', statusFilter);
      if (search) queryParams.set('search', search);

      const res = await fetch(`/api/sheets-cms/${sheetName}/rows?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRows(data.rows || []);
        setTotalRows(data.total_rows || 0);
        setSheetConfig(data.sheet_config);
      }
    } catch (e: any) {
      setAlertMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  }, [sheetName, statusFilter, search]);

  useEffect(() => {
    if (currentUser) {
      loadRows();
    }
  }, [currentUser, loadRows]);

  const handleSyncThisTab = async () => {
    try {
      const res = await fetch(`/api/sheets-cms/${sheetName}/sync`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setAlertMsg({ type: 'success', text: data.message });
        loadRows();
      } else {
        setAlertMsg({ type: 'error', text: data.error });
      }
    } catch (e: any) {
      setAlertMsg({ type: 'error', text: e.message });
    }
  };

  const handleOpenConflictForRecord = async (recordId: string) => {
    try {
      const res = await fetch('/api/sheets-cms/conflicts');
      if (res.ok) {
        const data = await res.json();
        const matched = (data.conflicts || []).find((c: any) => c.record_id === recordId && c.status === 'unresolved');
        if (matched) {
          setActiveConflict(matched);
        }
      }
    } catch (e) {
      console.error(e);
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
        loadRows();
      }
    } catch (e: any) {
      setAlertMsg({ type: 'error', text: e.message });
    }
  };

  if (loading && !sheetConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const isAdmin = currentUser?.role === 'administrator';

  return (
    <DashboardLayout
      user={currentUser!}
      breadcrumbs={[
        { label: 'Google Sheets CMS', href: '/sheets-cms' },
        { label: sheetName },
      ]}
    >
      <div className="space-y-5 animate-fadeIn">
        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline/20">
          <div>
            <Link
              href="/sheets-cms"
              className="inline-flex items-center gap-1.5 text-xs text-onSurface-muted hover:text-primary transition-colors mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>กลับสู่ภาพรวม</span>
            </Link>
            <h1 className="text-xl md:text-2xl font-heading font-extrabold text-onSurface flex items-center gap-2">
              <Layers className="w-6 h-6 text-primary" />
              <span>รายละเอียดการซิงค์แท็บ: {sheetName}</span>
            </h1>
            <p className="text-xs text-onSurface-muted mt-0.5">
              แสดงสถานะการซิงค์ระดับแถว (Row-level Sync Status) ของแท็บ {sheetName}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <OpenInSheetsButton
              sheetId={sheetConfig?.google_sheet_id}
              gid={sheetConfig?.google_tab_gid}
            />

            {isAdmin && (
              <button
                type="button"
                onClick={handleSyncThisTab}
                className="h-10 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-heading font-bold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                <span>สั่งซิงค์แท็บนี้</span>
              </button>
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

        {/* Filters & Search Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-card p-3 rounded-2xl border border-outline/30 shadow-level1">
          <div className="relative flex items-center flex-1 max-w-md">
            <Search className="w-4 h-4 text-onSurface-muted absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาตามหัวเรื่อง หรือรายละเอียดแถว..."
              className="w-full h-10 pl-9 pr-3 rounded-xl border border-outline bg-surface text-xs text-onSurface outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-onSurface-muted font-medium">สถานะ:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 px-3 rounded-xl border border-outline bg-surface text-xs text-onSurface outline-none cursor-pointer"
            >
              <option value="all">ทั้งหมด ({totalRows})</option>
              <option value="success">🟢 ซิงค์แล้ว</option>
              <option value="pending">🟡 รอซิงค์</option>
              <option value="error">🔴 ผิดพลาด</option>
              <option value="conflict">🟣 ขัดแย้ง</option>
            </select>
          </div>
        </div>

        {/* Row Table (C50) */}
        <SheetRowTable
          rows={rows}
          sheetName={sheetName}
          onResolveConflict={handleOpenConflictForRecord}
        />

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
