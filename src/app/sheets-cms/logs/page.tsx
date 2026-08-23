'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import SyncLogTimeline from '@/components/sheets/SyncLogTimeline';
import { SessionUser } from '@/types';
import { SyncLogItem } from '@/types/sheets';
import { ArrowLeft, History, Filter, RefreshCw, Loader2 } from 'lucide-react';

export default function SyncLogsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [logs, setLogs] = useState<SyncLogItem[]>([]);
  const [sheetFilter, setSheetFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

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

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (sheetFilter !== 'all') params.set('sheet_name', sheetFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await fetch(`/api/sheets-cms/logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [sheetFilter, statusFilter]);

  useEffect(() => {
    if (currentUser) {
      loadLogs();
    }
  }, [currentUser, loadLogs]);

  if (loading && logs.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout
      user={currentUser!}
      breadcrumbs={[
        { label: 'Google Sheets CMS', href: '/sheets-cms' },
        { label: 'ประวัติการซิงค์ (Sync Logs Timeline)' },
      ]}
    >
      <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
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
              <History className="w-6 h-6 text-primary" />
              <span>ประวัติการซิงค์ข้อมูล (Sync Logs Timeline)</span>
            </h1>
            <p className="text-xs text-onSurface-muted mt-0.5">
              บันทึกกิจกรรมการซิงค์แบบสองทาง ทั้งที่สำเร็จ ผิดพลาด และข้อขัดแย้ง
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadLogs()}
            className="h-10 px-3.5 rounded-xl border border-outline bg-surface-card hover:bg-surface-variant text-xs font-semibold text-onSurface flex items-center gap-1.5 self-start sm:self-center transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>รีเฟรชประวัติ</span>
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 bg-surface-card p-3 rounded-2xl border border-outline/30 shadow-level1 text-xs">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-onSurface-muted" />
            <span className="font-semibold text-onSurface">กรองชีท:</span>
            <select
              value={sheetFilter}
              onChange={(e) => setSheetFilter(e.target.value)}
              className="h-9 px-3 rounded-xl border border-outline bg-surface text-xs text-onSurface outline-none cursor-pointer"
            >
              <option value="all">ทุกแท็บ (ทั้งหมด 4 แท็บ)</option>
              <option value="Master_Users">Master_Users (ผู้ใช้งาน)</option>
              <option value="Knowledge_Base">Knowledge_Base (องค์ความรู้)</option>
              <option value="Master_Department">Master_Department (ฝ่ายหลัก)</option>
              <option value="Master_Section">Master_Section (งานย่อย)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-onSurface">สถานะ:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 rounded-xl border border-outline bg-surface text-xs text-onSurface outline-none cursor-pointer"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="success">🟢 สำเร็จ</option>
              <option value="error">🔴 ผิดพลาด</option>
              <option value="conflict">🟣 ขัดแย้ง</option>
            </select>
          </div>
        </div>

        {/* Logs Timeline (C58) */}
        <SyncLogTimeline logs={logs} />
      </div>
    </DashboardLayout>
  );
}
