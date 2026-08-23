'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import AiLogTable from '@/components/ai/AiLogTable';
import { SessionUser } from '@/types';
import { AiQueryLog } from '@/types/ai';
import { History, Play, Settings, RefreshCw, Loader2, Bot } from 'lucide-react';

export default function AiLogsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [logs, setLogs] = useState<AiQueryLog[]>([]);
  const [departments, setDepartments] = useState<{ department_id: string; name: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [confidenceFilter, setConfidenceFilter] = useState('all');
  const [feedbackFilter, setFeedbackFilter] = useState('all');

  useEffect(() => {
    async function loadUserAndDepts() {
      try {
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) {
          router.push('/login');
          return;
        }
        const userData = await userRes.json();
        setCurrentUser(userData.user);

        const deptRes = await fetch('/api/departments');
        if (deptRes.ok) {
          const deptData = await deptRes.json();
          setDepartments(deptData.departments || []);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadUserAndDepts();
  }, [router]);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        search: searchQuery,
        department_id: deptFilter,
        confidence: confidenceFilter,
        feedback: feedbackFilter
      });

      const res = await fetch(`/api/ai-engine/logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, deptFilter, confidenceFilter, feedbackFilter]);

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

  const isAdmin = currentUser?.role === 'administrator';

  return (
    <DashboardLayout
      user={currentUser!}
      breadcrumbs={[
        { label: 'ระบบปัญญาประดิษฐ์ (AI Engine)' },
        { label: 'บันทึกการสนทนา (AI Logs)' },
      ]}
    >
      <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline/20">
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-extrabold text-onSurface flex items-center gap-2.5">
              <History className="w-6 h-6 text-primary" />
              <span>บันทึกการสนทนา AI (AI Query Logs)</span>
            </h1>
            <p className="text-xs text-onSurface-muted mt-0.5">
              {isAdmin
                ? 'ติดตามทุกคำถามที่เข้ามาทาง LINE Official Account, ความแม่นยำ, แหล่งอ้างอิง และผลตอบรับจากผู้ใช้'
                : `ดูประวัติคำถามและการตอบของ AI เฉพาะที่เกี่ยวข้องกับ ${currentUser?.department_name || 'ฝ่ายงานของท่าน'}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/ai-engine/playground"
              className="h-10 px-3.5 rounded-xl border border-outline bg-surface-card hover:bg-surface-variant text-xs font-semibold text-onSurface flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Play className="w-4 h-4 text-primary" />
              <span>เปิด Playground</span>
            </Link>

            {isAdmin && (
              <Link
                href="/ai-engine/settings"
                className="h-10 px-3.5 rounded-xl border border-outline bg-surface-card hover:bg-surface-variant text-xs font-semibold text-onSurface flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Settings className="w-4 h-4 text-primary" />
                <span>ตั้งค่า AI</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => loadLogs()}
              className="h-10 px-3 rounded-xl border border-outline bg-surface-card hover:bg-surface-variant text-onSurface transition-colors"
              title="รีเฟรชประวัติ"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
            </button>
          </div>
        </div>

        {/* AI Logs Table Component (C68) */}
        <AiLogTable
          logs={logs}
          total={total}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            setPage(1);
          }}
          deptFilter={deptFilter}
          onDeptFilterChange={(d) => {
            setDeptFilter(d);
            setPage(1);
          }}
          confidenceFilter={confidenceFilter}
          onConfidenceFilterChange={(c) => {
            setConfidenceFilter(c);
            setPage(1);
          }}
          feedbackFilter={feedbackFilter}
          onFeedbackFilterChange={(f) => {
            setFeedbackFilter(f);
            setPage(1);
          }}
          departments={departments}
          isAdmin={isAdmin}
          onRefresh={loadLogs}
        />
      </div>
    </DashboardLayout>
  );
}
