const fs = require('fs');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// 7.1: Overview Page
ensureDir('./src/app/analytics');
fs.writeFileSync('./src/app/analytics/page.tsx', `'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
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
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then((d) => {
        if (d && d.user) setUser(d.user);
      })
      .catch(() => {});
  }, [router]);

  const loadData = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('preset', preset);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    fetch(\`/api/analytics/overview?\${params.toString()}\`)
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          setData(resData);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
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
              <RefreshCw className={\`w-4 h-4 \${loading ? 'animate-spin text-primary' : ''}\`} />
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
`, 'utf8');

// 7.2: Usage Page
ensureDir('./src/app/analytics/usage');
fs.writeFileSync('./src/app/analytics/usage/page.tsx', `'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import AnalyticsTabNav from '@/components/analytics/AnalyticsTabNav';
import DateRangePicker from '@/components/analytics/DateRangePicker';
import AnalyticsKpiCard from '@/components/analytics/AnalyticsKpiCard';
import TrendLineChart from '@/components/analytics/TrendLineChart';
import RankingList from '@/components/analytics/RankingList';
import RelativeTimeLabel from '@/components/dashboard/RelativeTimeLabel';
import { DateRangePreset, UsageAnalyticsResponse } from '@/types/analytics';
import { SessionUser } from '@/types';
import { Users, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function UsageAnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [preset, setPreset] = useState<DateRangePreset>('30d');
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();
  const [data, setData] = useState<UsageAnalyticsResponse | null>(null);

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

    fetch(\`/api/analytics/usage?\${params.toString()}\`)
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

  const kpiIcons = [Users, ShieldCheck, CheckCircle2, AlertCircle];

  return (
    <DashboardLayout
      user={user}
      breadcrumbs={[
        { label: 'สถิติและรายงาน', href: '/analytics' },
        { label: 'รายงานการใช้งานระบบ' },
      ]}
    >
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading font-black text-xl md:text-2xl text-onSurface flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              <span>รายงานการใช้งานระบบ (System Usage Report)</span>
            </h1>
            <p className="text-xs md:text-sm text-onSurface-muted mt-0.5">
              สถิติการเข้าสู่ระบบ บัญชีผู้ใช้งานที่ Active และความสมบูรณ์ในการซิงค์ข้อมูล
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrendLineChart
            data={data?.dailyActiveUsersTrend || []}
            title="แนวโน้มผู้ใช้งาน Active รายวัน"
            subtitle="จำนวนบุคลากรและเจ้าหน้าที่ที่เข้าสู่ระบบรายวัน"
            color="#059669"
            unit="คน"
          />
          <RankingList
            items={data?.departmentLogins || []}
            title="สถิติการเข้าสู่ระบบแยกตามฝ่ายงาน"
            subtitle="จัดอันดับฝ่ายที่มีความถี่ในการใช้งานระบบสูงสุด"
            unit="ครั้ง"
          />
        </div>

        {/* Recent Logins Table */}
        <div className="p-5 md:p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 space-y-4">
          <h3 className="font-heading font-bold text-sm md:text-base text-onSurface flex items-center gap-2 border-b border-outline/20 pb-3">
            <ShieldCheck className="w-4 h-4 text-primary" />
            <span>ประวัติการเข้าใช้งานล่าสุด (Recent Login Audits)</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-outline/20 text-onSurface-muted bg-surface/50">
                  <th className="p-2.5 font-semibold">ผู้ใช้งาน</th>
                  <th className="p-2.5 font-semibold">ฝ่ายงาน</th>
                  <th className="p-2.5 font-semibold">บทบาท</th>
                  <th className="p-2.5 font-semibold">IP Address</th>
                  <th className="p-2.5 font-semibold text-right">เวลาที่เข้าสู่ระบบ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/10">
                {data?.recentLogins.map((log) => (
                  <tr key={log.log_id} className="hover:bg-primary-container/10 transition-colors">
                    <td className="p-2.5 font-bold text-onSurface">{log.full_name}</td>
                    <td className="p-2.5 text-onSurface-muted">{log.department_name}</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-container text-primary">
                        {log.role}
                      </span>
                    </td>
                    <td className="p-2.5 text-onSurface-muted font-mono text-[11px]">{log.ip_address}</td>
                    <td className="p-2.5 text-right text-onSurface-muted">
                      <RelativeTimeLabel dateString={log.logged_in_at} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
`, 'utf8');

// 7.3: Knowledge Page
ensureDir('./src/app/analytics/knowledge');
fs.writeFileSync('./src/app/analytics/knowledge/page.tsx', `'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
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
    fetch('/api/auth/me')
      .then(res => { if (!res.ok) router.push('/login'); return res.json(); })
      .then(d => { if (d && d.user) setUser(d.user); });
  }, [router]);

  const loadData = () => {
    const params = new URLSearchParams();
    params.set('preset', preset);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);

    fetch(\`/api/analytics/knowledge?\${params.toString()}\`)
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
`, 'utf8');

// 7.4: AI Performance Page
ensureDir('./src/app/analytics/ai-performance');
fs.writeFileSync('./src/app/analytics/ai-performance/page.tsx', `'use client';
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

    fetch(\`/api/analytics/ai-performance?\${params.toString()}\`)
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
`, 'utf8');

// 7.5: LINE OA Page
ensureDir('./src/app/analytics/line');
fs.writeFileSync('./src/app/analytics/line/page.tsx', `'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import AnalyticsTabNav from '@/components/analytics/AnalyticsTabNav';
import DateRangePicker from '@/components/analytics/DateRangePicker';
import AnalyticsKpiCard from '@/components/analytics/AnalyticsKpiCard';
import TrendLineChart from '@/components/analytics/TrendLineChart';
import DonutChart from '@/components/analytics/DonutChart';
import RelativeTimeLabel from '@/components/dashboard/RelativeTimeLabel';
import { DateRangePreset, LineAnalyticsResponse } from '@/types/analytics';
import { SessionUser } from '@/types';
import { Smartphone, UserCheck, Send, MessageSquare, Loader2 } from 'lucide-react';

export default function LineAnalyticsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [preset, setPreset] = useState<DateRangePreset>('30d');
  const [startDate, setStartDate] = useState<string | undefined>();
  const [endDate, setEndDate] = useState<string | undefined>();
  const [data, setData] = useState<LineAnalyticsResponse | null>(null);

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

    fetch(\`/api/analytics/line?\${params.toString()}\`)
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

  const kpiIcons = [Smartphone, UserCheck, Send, MessageSquare];

  return (
    <DashboardLayout
      user={user}
      breadcrumbs={[
        { label: 'สถิติและรายงาน', href: '/analytics' },
        { label: 'LINE Official Account' },
      ]}
    >
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading font-black text-xl md:text-2xl text-onSurface flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-primary" />
              <span>รายงาน LINE Official Account (LINE OA Performance)</span>
            </h1>
            <p className="text-xs md:text-sm text-onSurface-muted mt-0.5">
              การเติบโตของผู้ติดตาม การผูกบัญชีบุคลากร/นักศึกษา และสถิติการส่งข้อความบรอดแคสต์
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
              data={data?.followerGrowthTrend || []}
              title="แนวโน้มการเติบโตของผู้ติดตาม LINE OA"
              subtitle="จำนวนผู้ติดตามสะสมในระบบ LINE Official Account"
              color="#059669"
              unit="คน"
            />
          </div>
          <DonutChart
            data={data?.accountLinkingBreakdown || []}
            title="สัดส่วนการผูกบัญชีผู้ติดตาม"
            subtitle="เปรียบเทียบผู้ติดตามที่ผูกบัญชีกับบุคคลทั่วไป"
          />
        </div>

        {/* Recent Broadcasts Table */}
        <div className="p-5 md:p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 space-y-4">
          <h3 className="font-heading font-bold text-sm md:text-base text-onSurface flex items-center gap-2 border-b border-outline/20 pb-3">
            <Send className="w-4 h-4 text-primary" />
            <span>ประวัติการส่งบรอดแคสต์ล่าสุด (Recent Broadcasts)</span>
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-outline/20 text-onSurface-muted bg-surface/50">
                  <th className="p-2.5 font-semibold">หัวข้อข่าว / ประกาศ</th>
                  <th className="p-2.5 font-semibold">กลุ่มเป้าหมาย</th>
                  <th className="p-2.5 font-semibold">ยอดส่งถึง</th>
                  <th className="p-2.5 font-semibold">สถานะ</th>
                  <th className="p-2.5 font-semibold text-right">เวลาที่ส่ง</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/10">
                {data?.recentBroadcasts.map((bc) => (
                  <tr key={bc.broadcast_id} className="hover:bg-primary-container/10 transition-colors">
                    <td className="p-2.5 font-bold text-onSurface">{bc.title}</td>
                    <td className="p-2.5 text-onSurface-muted">
                      {bc.target_type === 'all_followers' ? 'ผู้ติดตามทั้งหมด' : 'เฉพาะฝ่ายงาน'}
                    </td>
                    <td className="p-2.5 font-bold text-primary">{bc.delivered_count.toLocaleString()} คน</td>
                    <td className="p-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {bc.status}
                      </span>
                    </td>
                    <td className="p-2.5 text-right text-onSurface-muted">
                      <RelativeTimeLabel dateString={bc.sent_at} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
`, 'utf8');

// 7.6: Export Page
ensureDir('./src/app/analytics/export');
fs.writeFileSync('./src/app/analytics/export/page.tsx', `'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import AnalyticsTabNav from '@/components/analytics/AnalyticsTabNav';
import ReportCategoryCheckboxGroup from '@/components/analytics/ReportCategoryCheckboxGroup';
import ExportFormatSelector from '@/components/analytics/ExportFormatSelector';
import ReportPreviewPane from '@/components/analytics/ReportPreviewPane';
import { formatThaiDate } from '@/lib/date-utils';
import { SessionUser } from '@/types';
import { FileSpreadsheet, Download, Printer, CheckCircle, Loader2 } from 'lucide-react';

export default function CustomReportExportPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [title, setTitle] = useState('รายงานสรุปการวิเคราะห์ระบบ PR4Fang AI');
  const [categories, setCategories] = useState<('usage' | 'knowledge' | 'ai' | 'line')[]>(['usage', 'knowledge', 'ai', 'line']);
  const [format, setFormat] = useState<'pdf' | 'xlsx'>('pdf');
  const [startDate, setStartDate] = useState('2026-07-01');
  const [endDate, setEndDate] = useState('2026-07-31');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => { if (!res.ok) router.push('/login'); return res.json(); })
      .then(d => { if (d && d.user) setUser(d.user); });
  }, [router]);

  const handleExport = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          categories,
          startDate,
          endDate,
          format
        })
      });

      if (format === 'xlsx') {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = \`PR4Fang-Report-\${startDate}-to-\${endDate}.csv\`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        window.print();
      }
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setDownloading(false);
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
        { label: 'ส่งออกรายงานกำหนดเอง' },
      ]}
    >
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading font-black text-xl md:text-2xl text-onSurface flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-primary" />
              <span>ส่งออกรายงานกำหนดเอง (Custom Report Export)</span>
            </h1>
            <p className="text-xs md:text-sm text-onSurface-muted mt-0.5">
              สร้างและส่งออกรายงานสรุปข้อมูลหลายหมวดพร้อมหัวกระดาษทางการของวิทยาลัย
            </p>
          </div>
        </div>

        <AnalyticsTabNav isAdmin={user.role === 'administrator'} />

        {/* Builder Panel */}
        <div className="p-5 md:p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 space-y-6">
          {/* Step 1: Select Categories */}
          <div>
            <label className="text-xs md:text-sm font-bold text-onSurface block mb-2">
              1. เลือกหมวดข้อมูลที่ต้องการรวมในรายงาน (เลือกได้มากกว่า 1 หมวด)
            </label>
            <ReportCategoryCheckboxGroup
              selectedCategories={categories}
              onChange={setCategories}
            />
          </div>

          {/* Step 2: Date Range & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-outline/15">
            <div className="sm:col-span-1">
              <label className="text-xs font-bold text-onSurface block mb-1.5">วันที่เริ่มต้น</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-surface border border-outline/30 rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="text-xs font-bold text-onSurface block mb-1.5">วันที่สิ้นสุด</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-surface border border-outline/30 rounded-xl focus:outline-none focus:border-primary"
              />
            </div>
            <div className="sm:col-span-1">
              <label className="text-xs font-bold text-onSurface block mb-1.5">ชื่อหัวข้อรายงาน</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-surface border border-outline/30 rounded-xl focus:outline-none focus:border-primary font-medium"
              />
            </div>
          </div>

          {/* Step 3: Format Selector */}
          <div className="pt-2 border-t border-outline/15">
            <label className="text-xs md:text-sm font-bold text-onSurface block mb-2">
              2. เลือกรูปแบบไฟล์ส่งออก
            </label>
            <ExportFormatSelector format={format} onChange={setFormat} />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-outline/15 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleExport}
              disabled={downloading || categories.length === 0}
              className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs md:text-sm font-bold hover:bg-primary-dark shadow-sm flex items-center gap-2 disabled:opacity-50 transition-all"
            >
              {format === 'pdf' ? <Printer className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              <span>{downloading ? 'กำลังสร้างไฟล์...' : format === 'pdf' ? 'พิมพ์ / บันทึกเป็น PDF' : 'ดาวน์โหลดไฟล์ Excel (CSV)'}</span>
            </button>
          </div>
        </div>

        {/* Live A4 Preview Pane */}
        <div className="space-y-3">
          <h3 className="text-xs md:text-sm font-bold text-onSurface flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-primary" />
            <span>ตัวอย่างเอกสารรายงานก่อนส่งออกจริง (Print Preview)</span>
          </h3>
          <ReportPreviewPane
            title={title}
            dateRangeLabel={\`\${formatThaiDate(startDate, 'short')} - \${formatThaiDate(endDate, 'short')}\`}
            departmentName={user.role === 'administrator' ? 'ทุกฝ่ายงาน (ทั้งวิทยาลัย)' : 'ฝ่ายบริหารทรัพยากร'}
            selectedCategories={categories}
            generatedBy={\`\${user.first_name || 'ผู้ดูแลระบบ'} \${user.last_name || ''}\`}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
`, 'utf8');

// 7.7: Scheduled Reports Page (Admin Only)
ensureDir('./src/app/analytics/scheduled-reports');
fs.writeFileSync('./src/app/analytics/scheduled-reports/page.tsx', `'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
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
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) {
          router.push('/login');
          return null;
        }
        return res.json();
      })
      .then(d => {
        if (d && d.user) {
          if (d.user.role !== 'administrator') {
            router.push('/analytics');
            return;
          }
          setUser(d.user);
        }
      });
    loadSchedules();
  }, [router]);

  const loadSchedules = () => {
    fetch('/api/analytics/scheduled-reports')
      .then(res => res.json())
      .then(data => {
        if (data.schedules) setSchedules(data.schedules);
      });
  };

  const handleToggle = async (id: string, current: boolean) => {
    await fetch(\`/api/analytics/scheduled-reports/\${id}\`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !current })
    });
    loadSchedules();
  };

  const handleDelete = async (id: string) => {
    if (confirm('คุณต้องการลบการตั้งเวลารายงานนี้ใช่หรือไม่?')) {
      await fetch(\`/api/analytics/scheduled-reports/\${id}\`, { method: 'DELETE' });
      loadSchedules();
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (recipients.length === 0) return;
    setLoading(true);
    try {
      await fetch('/api/analytics/scheduled-reports', {
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
`, 'utf8');

console.log('All Phase 7 Pages rebuilt with DashboardLayoutProps!');
