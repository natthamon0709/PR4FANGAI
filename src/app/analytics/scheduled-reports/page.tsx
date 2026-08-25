'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { safeFetchJson } from '@/lib/api-client';
import AnalyticsTabNav from '@/components/analytics/AnalyticsTabNav';
import ScheduledReportRow from '@/components/analytics/ScheduledReportRow';
import RecipientPicker from '@/components/analytics/RecipientPicker';
import { ScheduledReportConfig } from '@/types/analytics';
import { SessionUser } from '@/types';
import { Clock, Plus, Mail, Loader2 } from 'lucide-react';

export default function ScheduledReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [schedules, setSchedules] = useState<ScheduledReportConfig[]>([]);
  const [isOpenAdd, setIsOpenAdd] = useState(false);
  const [reportType, setReportType] = useState<'usage' | 'knowledge' | 'ai_performance' | 'line'>('ai_performance');
  const [frequency, setFrequency] = useState<'weekly' | 'monthly'>('monthly');
  const [recipients, setRecipients] = useState<string[]>(['director@fang.ac.th']);
  const [format, setFormat] = useState<'pdf' | 'xlsx'>('pdf');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function init() {
      const res = await safeFetchJson('/api/auth/me');
      if (res.ok && res.data?.user) {
        if (res.data.user.role !== 'administrator') {
          router.push('/analytics');
          return;
        }
        setUser(res.data.user);
      } else {
        router.push('/login');
        return;
      }
      loadSchedules();
    }
    init();
  }, [router]);

  const loadSchedules = async () => {
    const res = await safeFetchJson('/api/analytics/scheduled-reports');
    if (res.ok && res.data?.schedules) {
      setSchedules(res.data.schedules);
    }
  };

  const handleToggle = async (id: string, current: boolean) => {
    await safeFetchJson(`/api/analytics/scheduled-reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_active: !current })
    });
    loadSchedules();
  };

  const handleDelete = async (id: string) => {
    if (confirm('คุณต้องการลบการตั้งเวลารายงานนี้ใช่หรือไม่?')) {
      await safeFetchJson(`/api/analytics/scheduled-reports/${id}`, { method: 'DELETE' });
      loadSchedules();
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recipients.length === 0) return;
    setLoading(true);
    try {
      await safeFetchJson('/api/analytics/scheduled-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_type: reportType,
          frequency,
          recipients,
          format,
          is_active: true
        })
      });
      setIsOpenAdd(false);
      loadSchedules();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout
      user={user}
      breadcrumbs={[
        { label: 'สถิติและรายงาน', href: '/analytics' },
        { label: 'ตั้งเวลาส่งรายงานอัตโนมัติ' },
      ]}
    >
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading font-black text-xl md:text-2xl text-onSurface flex items-center gap-2">
              <Clock className="w-6 h-6 text-primary" />
              <span>ตั้งเวลาส่งรายงานอัตโนมัติ (Scheduled Executive Reports)</span>
            </h1>
            <p className="text-xs md:text-sm text-onSurface-muted mt-0.5">
              ส่งรายงานสรุปสถิติประจำสัปดาห์หรือประจำเดือนทางอีเมลถึงผู้บริหารโดยอัตโนมัติ
            </p>
          </div>
          <button
            onClick={() => setIsOpenAdd(!isOpenAdd)}
            className="px-4 py-2 bg-primary text-white rounded-xl text-xs md:text-sm font-bold hover:bg-primary-dark shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างรอบส่งรายงานใหม่</span>
          </button>
        </div>

        <AnalyticsTabNav isAdmin={user.role === 'administrator'} />

        {/* Add Schedule Modal / Panel */}
        {isOpenAdd && (
          <form onSubmit={handleCreate} className="p-5 md:p-6 bg-surface-card rounded-2xl border-2 border-primary/40 shadow-level2 space-y-4">
            <h3 className="font-bold text-sm text-onSurface flex items-center gap-2 border-b border-outline/20 pb-2">
              <Mail className="w-4 h-4 text-primary" />
              <span>ตั้งค่ารอบส่งรายงานอัตโนมัติฉบับใหม่</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-onSurface block mb-1.5">หมวดรายงาน</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-surface border border-outline/30 rounded-xl focus:outline-none focus:border-primary"
                >
                  <option value="ai_performance">ประสิทธิภาพ AI (RAG)</option>
                  <option value="usage">การใช้งานระบบ (Usage)</option>
                  <option value="knowledge">ประสิทธิภาพองค์ความรู้ (KM)</option>
                  <option value="line">LINE Official Account</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-onSurface block mb-1.5">รอบเวลาส่ง</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-surface border border-outline/30 rounded-xl focus:outline-none focus:border-primary"
                >
                  <option value="weekly">รายสัปดาห์ (ทุกวันจันทร์)</option>
                  <option value="monthly">รายเดือน (วันแรกของเดือน)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-onSurface block mb-1.5">รูปแบบไฟล์แนบ</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-surface border border-outline/30 rounded-xl focus:outline-none focus:border-primary"
                >
                  <option value="pdf">PDF (ทางการพร้อมพิมพ์)</option>
                  <option value="xlsx">Excel (ไฟล์ CSV/XLSX)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-onSurface block mb-1.5">ผู้รับรายงานทางอีเมล</label>
              <RecipientPicker recipients={recipients} onChange={setRecipients} />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-outline/15">
              <button
                type="button"
                onClick={() => setIsOpenAdd(false)}
                className="px-3 py-1.5 text-xs text-onSurface-muted hover:text-onSurface"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={loading || recipients.length === 0}
                className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark disabled:opacity-50"
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
              </button>
            </div>
          </form>
        )}

        {/* Scheduled List */}
        <div className="space-y-3">
          {schedules.map((sched) => (
            <ScheduledReportRow
              key={sched.config_id}
              schedule={sched}
              onToggleActive={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
