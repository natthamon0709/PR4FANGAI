'use client';
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

    fetch(`/api/analytics/line?${params.toString()}`)
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
