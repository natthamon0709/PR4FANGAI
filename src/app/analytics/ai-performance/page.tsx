'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import AnalyticsTabNav from '@/components/analytics/AnalyticsTabNav';
import DateRangePicker from '@/components/analytics/DateRangePicker';
import AnalyticsKpiCard from '@/components/analytics/AnalyticsKpiCard';
import StackedBarChart from '@/components/analytics/StackedBarChart';
import DonutChart from '@/components/analytics/DonutChart';
import TrendLineChart from '@/components/analytics/TrendLineChart';
import RankingList from '@/components/analytics/RankingList';
import { DateRangePreset, AiPerformanceResponse } from '@/types/analytics';
import { SessionUser } from '@/types';
import { Bot, CheckCircle, Target, Clock, Loader2 } from 'lucide-react';

export default function AiPerformancePage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [preset, setPreset] = useState<DateRangePreset>('30d');
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();
  const [data, setData] = useState<AiPerformanceResponse | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => { if (!res.ok) router.push('/login'); return res.json(); })
      .then(d => { if (d && d.user) setUser(d.user); });
  }, [router]);

  const loadData = () => {
    const params = new URLSearchParams();
    params.set('preset', preset);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    fetch(`/api/analytics/ai-performance?${params.toString()}`)
      .then(res => res.json())
      .then(resData => { if (resData.success) setData(resData); });
  };

  useEffect(() => { if (user) loadData(); }, [user, preset, startDate, endDate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const kpiIcons = [Bot, CheckCircle, Target, Clock];

  return (
    <DashboardLayout
      user={user}
      breadcrumbs={[
        { label: 'สถิติและรายงาน', href: '/analytics' },
        { label: 'ประสิทธิภาพ AI (RAG)' },
      ]}
    >
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading font-black text-xl md:text-2xl text-onSurface flex items-center gap-2">
              <Bot className="w-6 h-6 text-primary" />
              <span>รายงานประสิทธิภาพ AI (AI Processing & RAG Performance)</span>
            </h1>
            <p className="text-xs md:text-sm text-onSurface-muted mt-0.5">
              การวิเคราะห์ความแม่นยำ ระดับความมั่นใจ เวลาตอบสนอง และผลตอบรับจากผู้ใช้งาน
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

        {/* Stacked Confidence Bar Chart */}
        <StackedBarChart
          data={data?.confidenceStackedTrend || []}
          title="สัดส่วนระดับความมั่นใจของคำตอบ AI รายวัน"
          subtitle="แยกตามระดับคะแนนความเกี่ยวข้อง (สูง / กลาง / ต่ำ / Fallback)"
        />

        {/* Donut Feedback & Latency Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DonutChart
            data={data?.feedbackBreakdown || []}
            title="ผลตอบรับจากผู้ใช้งาน (User Feedback)"
            subtitle="สัดส่วนคำตอบที่มีประโยชน์ (👍) และต้องปรับปรุง (👎)"
          />
          <TrendLineChart
            data={data?.avgLatencyTrend || []}
            title="เวลาตอบสนองเฉลี่ย (Response Latency)"
            subtitle="ความเร็วเฉลี่ยในการประมวลผลคำตอบ (วินาที)"
            color="#D97706"
            unit="วินาที"
          />
        </div>

        {/* Knowledge Gaps Ranking */}
        <RankingList
          items={data?.topKnowledgeGaps || []}
          title="คำถามที่ AI ตอบไม่ได้บ่อยที่สุด (Knowledge Gaps)"
          subtitle="ประเด็นที่ผู้ใช้งานถามบ่อยแต่ยังไม่มีข้อมูลในระบบ (กดเพื่อสร้างบทความตอบคำถาม)"
          unit="ครั้ง"
          viewAllLink="/ai-logs?filter=unanswered"
        />
      </div>
    </DashboardLayout>
  );
}
