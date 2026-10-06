'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { safeFetchJson } from '@/lib/api-client';
import AnalyticsTabNav from '@/components/analytics/AnalyticsTabNav';
import ReportCategoryCheckboxGroup from '@/components/analytics/ReportCategoryCheckboxGroup';
import ExportFormatSelector from '@/components/analytics/ExportFormatSelector';
import ReportPreviewPane, { ReportExportData } from '@/components/analytics/ReportPreviewPane';
import { formatThaiDate } from '@/lib/date-utils';
import { SessionUser } from '@/types';
import { FileSpreadsheet, Download, Printer, CheckCircle, Loader2, RefreshCw } from 'lucide-react';

export default function CustomReportExportPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [title, setTitle] = useState('รายงานสรุปการวิเคราะห์ระบบ PR4Fang AI');
  const [categories, setCategories] = useState<('usage' | 'knowledge' | 'ai' | 'line')[]>([
    'usage',
    'knowledge',
    'ai',
    'line'
  ]);
  const [format, setFormat] = useState<'pdf' | 'xlsx'>('pdf');

  // Default to past 30 days
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });

  const [downloading, setDownloading] = useState(false);
  const [reportData, setReportData] = useState<ReportExportData | null>(null);
  const [loadingData, setLoadingData] = useState(false);

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

  const loadReportData = async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const res = await safeFetchJson('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          categories,
          startDate,
          endDate,
          format: 'json'
        })
      });

      if (res.ok && res.data) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (user && categories.length > 0) {
      loadReportData();
    }
  }, [user, categories, startDate, endDate, title]);

  const handleExport = async () => {
    setDownloading(true);
    try {
      if (format === 'xlsx') {
        const res = await fetch('/api/analytics/export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            categories,
            startDate,
            endDate,
            format: 'xlsx'
          })
        });

        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `PR4Fang-Report-${startDate}-to-${endDate}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        // PDF mode: Refresh data first if needed then print clean report
        await loadReportData();
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

  const dateRangeLabel = `${formatThaiDate(startDate, 'short')} - ${formatThaiDate(endDate, 'short')}`;
  const departmentName = user.role === 'administrator' ? 'ทุกฝ่ายงาน (ทั้งวิทยาลัย)' : 'ฝ่ายบริหารทรัพยากร';
  const generatedBy = `${user.first_name || 'ผู้ดูแลระบบ'} ${user.last_name || ''}`;

  return (
    <DashboardLayout
      user={user}
      breadcrumbs={[
        { label: 'สถิติและรายงาน', href: '/analytics' },
        { label: 'ส่งออกรายงานกำหนดเอง' },
      ]}
    >
      <div className="space-y-6 pb-12">
        {/* Header Section (Hidden during print) */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-heading font-black text-xl md:text-2xl text-onSurface flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-primary" />
              <span>ส่งออกรายงานกำหนดเอง (Custom Report Export)</span>
            </h1>
            <p className="text-xs md:text-sm text-onSurface-muted mt-0.5">
              ดึงข้อมูลจริงจากระบบพร้อมจัดพิมพ์หัวกระดาษทางการของวิทยาลัยการอาชีพฝาง
            </p>
          </div>
        </div>

        {/* Tab Navigation (Hidden during print) */}
        <div className="no-print">
          <AnalyticsTabNav isAdmin={user.role === 'administrator'} />
        </div>

        {/* Builder Panel (Hidden during print) */}
        <div className="no-print p-5 md:p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 space-y-6">
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
          <div className="pt-4 border-t border-outline/15 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={loadReportData}
              disabled={loadingData}
              className="px-4 py-2 bg-surface hover:bg-surface-variant text-onSurface text-xs font-semibold rounded-xl border border-outline/25 flex items-center gap-2 transition-all disabled:opacity-50"
              title="ดึงข้อมูลล่าสุดจากฐานข้อมูล"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin text-primary' : ''}`} />
              <span>รีเฟรชข้อมูลจริง</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExport}
                disabled={downloading || categories.length === 0}
                className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs md:text-sm font-bold hover:bg-primary-dark shadow-sm flex items-center gap-2 disabled:opacity-50 transition-all"
              >
                {format === 'pdf' ? <Printer className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                <span>
                  {downloading
                    ? 'กำลังสร้างไฟล์...'
                    : format === 'pdf'
                    ? 'พิมพ์ / บันทึกเป็น PDF (Print)'
                    : 'ดาวน์โหลดไฟล์ Excel (CSV)'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Live A4 Preview Pane Header (Hidden during print) */}
        <div className="no-print flex items-center justify-between pt-2">
          <h3 className="text-xs md:text-sm font-bold text-onSurface flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-primary" />
            <span>ตัวอย่างเอกสารรายงานก่อนส่งออกจริง (Official A4 Print Preview)</span>
          </h3>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-1.5 bg-[#800000] text-white rounded-lg text-xs font-bold hover:bg-[#520000] flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>พิมพ์ / เซฟเป็น PDF</span>
          </button>
        </div>

        {/* Live A4 Preview Component (Will be printed exclusively) */}
        <ReportPreviewPane
          title={title}
          dateRangeLabel={dateRangeLabel}
          departmentName={departmentName}
          selectedCategories={categories}
          generatedBy={generatedBy}
          reportData={reportData}
          loading={loadingData}
        />
      </div>
    </DashboardLayout>
  );
}
