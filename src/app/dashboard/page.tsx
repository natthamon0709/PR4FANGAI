'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import KpiCardGroup from '@/components/dashboard/KpiCardGroup';
import DepartmentQueryChart from '@/components/dashboard/DepartmentQueryChart';
import KnowledgeGrowthChart from '@/components/dashboard/KnowledgeGrowthChart';
import RecentKnowledgeList from '@/components/dashboard/RecentKnowledgeList';
import KnowledgeGapList from '@/components/dashboard/KnowledgeGapList';
import AnnouncementWidget from '@/components/dashboard/AnnouncementWidget';
import SheetSyncStatusCard from '@/components/dashboard/SheetSyncStatusCard';
import QuickAddButton from '@/components/dashboard/QuickAddButton';
import SessionAlert from '@/components/SessionAlert';
import { SessionUser } from '@/types';
import { DashboardSummaryResponse } from '@/types/dashboard';
import { 
  Users, 
  BookOpen, 
  FileSpreadsheet, 
  Bot, 
  Sparkles, 
  PlusCircle, 
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 1. Load Auth & Initial Summary
  const loadDashboardData = useCallback(async (isRefresh: boolean = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      // 1. Get Me
      const authRes = await fetch('/api/auth/me');
      if (!authRes.ok) {
        router.push('/login');
        return;
      }
      const authData = await authRes.json();
      setCurrentUser(authData.user);

      // 2. Get Dashboard Summary (or Refresh)
      const url = isRefresh ? '/api/dashboard/refresh' : '/api/dashboard/summary';
      const method = isRefresh ? 'POST' : 'GET';
      const summaryRes = await fetch(url, { method });

      if (summaryRes.ok) {
        const summaryData = await summaryRes.json();
        setSummary(isRefresh ? summaryData.summary : summaryData);
        if (isRefresh) {
          setAlertMsg({ type: 'success', text: 'รีเฟรชข้อมูลภาพรวมและสถิติล่าสุดเรียบร้อยแล้ว' });
        }
      }
    } catch (e: any) {
      console.error(e);
      setAlertMsg({ type: 'error', text: 'เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + e.message });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    loadDashboardData(false);
  }, [loadDashboardData]);

  if (loading || !currentUser || !summary) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface space-y-3">
        <div className="w-9 h-9 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-onSurface-muted">กำลังเตรียมข้อมูลแดชบอร์ด PR4Fang AI...</p>
      </div>
    );
  }

  const isAdmin = currentUser.role === 'administrator';

  return (
    <DashboardLayout user={currentUser} breadcrumbs={[]}>
      <div className="space-y-6 animate-fadeIn">
        {/* Header (C21) */}
        <DashboardHeader
          user={currentUser}
          calculatedAt={summary.calculated_at}
          isCached={summary.is_cached}
          onRefresh={() => loadDashboardData(true)}
          refreshing={refreshing}
        />

        {alertMsg && (
          <SessionAlert
            type={alertMsg.type}
            message={alertMsg.text}
            onClose={() => setAlertMsg(null)}
          />
        )}

        {/* 1. KPI Cards Group (C22 & C23) */}
        <KpiCardGroup kpis={summary.kpis} />

        {/* ========================================================================= */}
        {/* 2. ADMINISTRATOR VIEW (Section 4.1 Wireframe)                             */}
        {/* ========================================================================= */}
        {isAdmin && (
          <>
            {/* Charts Row: Bar Chart (C24) + Growth Line Chart (C25) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <DepartmentQueryChart data={summary.department_queries} />
              <KnowledgeGrowthChart data={summary.knowledge_growth} />
            </div>

            {/* Widgets Row: Recent Knowledge (C26) + Knowledge Gap (C27) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentKnowledgeList
                activities={summary.recent_activities}
                title="องค์ความรู้อัปเดตล่าสุด (ทั้งวิทยาลัย)"
                viewAllHref="/knowledge"
              />
              <KnowledgeGapList
                gaps={summary.knowledge_gaps}
                title="คำถามที่ AI ตอบไม่ได้ (Knowledge Gap)"
              />
            </div>

            {/* Bottom Row: Google Sheets Sync Status Card (C29) + Announcements */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <SheetSyncStatusCard
                  pendingCount={summary.sync_status?.pending_count || 0}
                  lastSynced={summary.sync_status?.last_synced}
                  sheetUrl={summary.sync_status?.sheet_url}
                />
              </div>
              <div className="lg:col-span-2">
                <AnnouncementWidget announcements={summary.announcements} />
              </div>
            </div>
          </>
        )}

        {/* ========================================================================= */}
        {/* 3. STAFF VIEW (Section 4.2 Wireframe)                                     */}
        {/* ========================================================================= */}
        {!isAdmin && (
          <>
            {/* Quick Action Banner for Staff */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-primary-container/80 to-surface-card border border-primary/20 shadow-level1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Sparkles className="w-4 h-4 text-secondary" />
                  <span>จัดการองค์ความรู้ประจำฝ่าย</span>
                </div>
                <h3 className="font-heading font-bold text-base text-onSurface">
                  มีข้อมูล ระเบียบ หรือแบบฟอร์มใหม่ของ{currentUser.department_name}ที่ต้องการอัปเดต?
                </h3>
                <p className="text-xs text-onSurface-muted">
                  เพิ่มข้อมูลเข้าสู่ระบบเพื่อให้ AI ช่วยตอบคำถามบุคลากรและนักศึกษาอย่างแม่นยำ
                </p>
              </div>

              {/* Quick Add Button (C30) */}
              <QuickAddButton
                href="/knowledge/new"
                label="+ เพิ่มองค์ความรู้ใหม่"
                className="flex-shrink-0"
              />
            </div>

            {/* Staff Main Grid: Recent My Knowledge (C26) + Announcements (C28) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RecentKnowledgeList
                activities={summary.recent_activities}
                title="งานของฉันและองค์ความรู้ล่าสุดในฝ่าย"
                viewAllHref="/knowledge"
              />
              <AnnouncementWidget
                announcements={summary.announcements}
                title="ประกาศจากวิทยาลัยและฝ่าย"
              />
            </div>

            {/* Bottom Row: Knowledge Gaps in Department + Sheet Sync */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <KnowledgeGapList
                  gaps={summary.knowledge_gaps}
                  title={`คำถาม AI ที่เกี่ยวข้องกับ ${(currentUser?.department_name || 'ฝ่ายงาน').replace('ฝ่าย', '')}`}
                />
              </div>
              <div className="lg:col-span-1">
                <SheetSyncStatusCard
                  pendingCount={summary.sync_status?.pending_count || 0}
                  lastSynced={summary.sync_status?.last_synced}
                  sheetUrl={summary.sync_status?.sheet_url}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
