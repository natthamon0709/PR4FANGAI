'use client';
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

    fetch(`/api/analytics/usage?${params.toString()}`)
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
