'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { safeFetchJson } from '@/lib/api-client';
import AnalyticsTabNav from '@/components/analytics/AnalyticsTabNav';
import DateRangePicker from '@/components/analytics/DateRangePicker';
import AnalyticsKpiCard from '@/components/analytics/AnalyticsKpiCard';
import TrendLineChart from '@/components/analytics/TrendLineChart';
import DonutChart from '@/components/analytics/DonutChart';
import RankingList from '@/components/analytics/RankingList';
import { DateRangePreset, KnowledgeAnalyticsResponse } from '@/types/analytics';
import { SessionUser } from '@/types';
import { BookOpen, CheckCircle, Zap, Layers, Loader2 } from 'lucide-react';

export default function KnowledgeAnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [preset, setPreset] = useState<DateRangePreset>('30d');
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();
  const [data, setData] = useState<KnowledgeAnalyticsResponse | null>(null);

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
    const params = new URLSearchParams();
    params.set('preset', preset);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    const res = await safeFetchJson(`/api/analytics/knowledge?${params.toString()}`);
    if (res.ok && res.data?.success) {
      setData(res.data);
    }
  };

  useEffect(() => { if (user) loadData(); }, [user, preset, startDate, endDate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const kpiIcons = [BookOpen, CheckCircle, Zap, Layers];

  return (
    <DashboardLayout
      user={user}
      breadcrumbs={[
        { label: 'สถิติและรายงาน', href: '/analytics' },
        { label: 'ประสิทธิภาพองค์ความรู้' },
      ]}
    >
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading font-black text-xl md:text-2xl text-onSurface flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              <span>รายงานประสิทธิภาพองค์ความรู้ (Knowledge Management Report)</span>
            </h1>
            <p className="text-xs md:text-sm text-onSurface-muted mt-0.5">
              อัตราการเติบโตของเนื้อหา สัดส่วนประเภทบทความ และการนำไปใช้ตอบคำถาม
            </p>
          </div>
          <DateRangePicker
            preset={preset}
            startDate={startDate}
            endDate={endDate}
            onRangeChange={(p, s, e) => { setPreset(p); setStartDate(s); setEndDate(e); }}
          />
        </div>

        <AnalyticsTabNav isAdmin={user.role === 'administrator'} />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data?.kpis.map((kpi, idx) => (
            <AnalyticsKpiCard key={kpi.key} kpi={kpi} icon={kpiIcons[idx % kpiIcons.length]} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TrendLineChart
              data={data?.growthTrend || []}
              title="การเติบโตขององค์ความรู้สะสม"
              subtitle="จำนวนบทความสะสมในคลังความรู้ตลอดช่วงเวลา"
              color="#2563EB"
              unit="บทความ"
            />
          </div>
          <DonutChart
            data={data?.contentTypeBreakdown || []}
            title="สัดส่วนประเภทองค์ความรู้"
            subtitle="แยกตาม FAQ, ข่าว, ประกาศ และเอกสาร"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RankingList
            items={data?.topUsedArticles || []}
            title="บทความที่ AI เรียกใช้สูงสุด"
            subtitle="จัดอันดับตามจำนวนครั้งที่ AI นำข้อมูลไปสังเคราะห์คำตอบ"
            unit="ครั้ง"
            viewAllLink="/knowledge"
          />
          <RankingList
            items={data?.departmentContributions || []}
            title="สัดส่วนการสร้างองค์ความรู้แยกตามฝ่าย"
            subtitle="จัดอันดับฝ่ายที่มีจำนวนบทความในระบบมากที่สุด"
            unit="รายการ"
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
