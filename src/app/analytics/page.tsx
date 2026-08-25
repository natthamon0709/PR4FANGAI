'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { safeFetchJson } from '@/lib/api-client';
import AnalyticsTabNav from '@/components/analytics/AnalyticsTabNav';
import DateRangePicker from '@/components/analytics/DateRangePicker';
import AnalyticsKpiCard from '@/components/analytics/AnalyticsKpiCard';
import TrendLineChart from '@/components/analytics/TrendLineChart';
import RankingList from '@/components/analytics/RankingList';
import { DateRangePreset, AnalyticsOverviewResponse } from '@/types/analytics';
import { SessionUser } from '@/types';
import { BarChart3, Users, BookOpen, Bot, Smartphone, RefreshCw, Loader2 } from 'lucide-react';

export default function AnalyticsOverviewPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [preset, setPreset] = useState<DateRangePreset>('30d');
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();
  const [data, setData] = useState<AnalyticsOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const res = await safeFetchJson('/api/auth/me');
      if (res.ok && res.data?.user) {
        setUser(res.data.user);
      } else {
        router.push('/login');
      }
    }
    checkAuth();
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('preset', preset);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    const res = await safeFetchJson(`/api/analytics/overview?${params.toString()}`);
    if (res.ok && res.data?.success) {
      setData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) loadData();
  }, [user, preset, startDate, endDate]);

  const handleRangeChange = (newPreset: DateRangePreset, s?: string, e?: string) => {
    setPreset(newPreset);
    setStartDate(s);
    setEndDate(e);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const kpiIcons = [Users, BookOpen, Bot, Smartphone];

  return (
    <DashboardLayout
      user={user}
      breadcrumbs={[
        { label: 'สถิติและรายงาน', href: '/analytics' },
        { label: 'ภาพรวมการวิเคราะห์' },
      ]}
    >
      <div className="space-y-6 pb-12">
        {/* Header with Title & DateRangePicker */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading font-black text-xl md:text-2xl text-onSurface flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-primary" />
              <span>การวิเคราะห์และรายงาน (Analytics & Reports)</span>
            </h1>
            <p className="text-xs md:text-sm text-onSurface-muted mt-0.5">
              ศูนย์รวมรายงานเชิงลึก 4 หมวดของวิทยาลัยการอาชีพฝาง สำหรับผู้บริหารและหัวหน้างาน
            </p>
          </div>

          <div className="flex items-center gap-2">
            <DateRangePicker
              preset={preset}
              startDate={startDate}
              endDate={endDate}
              onRangeChange={handleRangeChange}
            />
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-full border border-outline/30 bg-surface-card hover:bg-surface text-onSurface-muted hover:text-primary transition-all disabled:opacity-50"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <AnalyticsTabNav isAdmin={user.role === 'administrator'} />

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data?.kpis.map((kpi, idx) => (
            <AnalyticsKpiCard key={kpi.key} kpi={kpi} icon={kpiIcons[idx % kpiIcons.length]} />
          ))}
        </div>

        {/* 30-Day Trend Chart */}
        <TrendLineChart
          data={data?.aiQuestionTrend || []}
          title="แนวโน้มจำนวนคำถาม AI รายวัน"
          subtitle="สถิติความถี่ในการส่งคำถามเข้ามายัง LINE Official Account"
          color="#800000"
          unit="คำถาม"
        />

        {/* 2-Column Rankings: Top Knowledge Items & Department Questions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RankingList
            items={data?.topKnowledgeItems || []}
            title="องค์ความรู้ยอดนิยม (ที่ AI ดึงไปตอบบ่อยที่สุด)"
            subtitle="จัดอันดับตามจำนวนครั้งที่ถูกนำไปใช้ตอบคำถามผู้ใช้งาน"
            unit="ครั้ง"
            viewAllLink="/knowledge"
          />

          <RankingList
            items={data?.departmentQuestions || []}
            title="ฝ่ายที่มีการใช้งานและตอบคำถามสูงสุด"
            subtitle="จัดอันดับตามปริมาณคำถาม AI ที่เกี่ยวข้องกับฝ่ายนั้น ๆ"
            unit="คำถาม"
            viewAllLink="/ai-logs"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
