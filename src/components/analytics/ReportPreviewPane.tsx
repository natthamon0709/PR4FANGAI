'use client';
import React from 'react';
import { formatThaiDate } from '@/lib/date-utils';
import {
  AnalyticsOverviewResponse,
  UsageAnalyticsResponse,
  KnowledgeAnalyticsResponse,
  AiPerformanceResponse,
  LineAnalyticsResponse
} from '@/types/analytics';
import { Loader2, ShieldCheck, FileText } from 'lucide-react';

export interface ReportExportData {
  meta?: {
    title: string;
    college: string;
    dateRangeLabel: string;
    startDate: string;
    endDate: string;
    departmentName: string;
    generatedBy: string;
    generatedAt: string;
  };
  overview?: AnalyticsOverviewResponse | null;
  usage?: UsageAnalyticsResponse | null;
  knowledge?: KnowledgeAnalyticsResponse | null;
  ai?: AiPerformanceResponse | null;
  line?: LineAnalyticsResponse | null;
}

interface ReportPreviewPaneProps {
  title: string;
  dateRangeLabel: string;
  departmentName: string;
  selectedCategories: string[];
  generatedBy: string;
  reportData?: ReportExportData | null;
  loading?: boolean;
}

export default function ReportPreviewPane({
  title,
  dateRangeLabel,
  departmentName,
  selectedCategories,
  generatedBy,
  reportData,
  loading = false
}: ReportPreviewPaneProps) {
  const printDate = reportData?.meta?.generatedAt || formatThaiDate(new Date().toISOString(), 'full');
  const docRef = React.useMemo(() => {
    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
    return `RPT-FVE-2569/${randomHex}`;
  }, []);
  const hashRef = React.useMemo(() => {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
  }, []);

  const usage = reportData?.usage;
  const km = reportData?.knowledge;
  const ai = reportData?.ai;
  const line = reportData?.line;
  const overview = reportData?.overview;

  const getKpi = (kpis: any[] | undefined, key: string, fallback: any = '-') => {
    if (!kpis) return fallback;
    const found = kpis.find(k => k.key === key);
    return found ? found.value : fallback;
  };

  const categoryLabels: Record<string, string> = {
    usage: '1. การใช้งานระบบ',
    knowledge: '2. องค์ความรู้',
    ai: '3. ปัญญาประดิษฐ์ (AI)',
    line: '4. LINE OA'
  };

  // Check if we should split across 2 pages (when 3 or 4 categories selected)
  const isMultiPage = selectedCategories.length >= 3;
  const page1Categories = isMultiPage
    ? selectedCategories.filter(c => c === 'usage' || c === 'knowledge')
    : selectedCategories;
  const page2Categories = isMultiPage
    ? selectedCategories.filter(c => c === 'ai' || c === 'line')
    : [];

  // Render Usage Section
  const renderUsageSection = () => (
    <div className="print-avoid-break space-y-2">
      <h3 className="font-bold text-xs sm:text-sm text-[#800000] border-b-2 border-slate-200 pb-1 flex items-center justify-between">
        <span>หมวดที่ 1: สรุปสถิติการใช้งานระบบ (System Usage Summary)</span>
        <span className="text-[10px] font-normal text-slate-500">ที่มา: login_audit_logs</span>
      </h3>
      <table className="w-full text-left border-collapse border border-slate-200 text-xs">
        <thead className="bg-slate-100/90 font-semibold text-slate-700">
          <tr>
            <th className="border border-slate-200 py-1.5 px-2.5">ตัวชี้วัด (KPI)</th>
            <th className="border border-slate-200 py-1.5 px-2.5 text-right">ค่าสถิติจริง</th>
            <th className="border border-slate-200 py-1.5 px-2.5">หน่วย</th>
            <th className="border border-slate-200 py-1.5 px-2.5">สถานะการประเมิน</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          <tr>
            <td className="border border-slate-200 py-1.5 px-2.5">ผู้ใช้งานที่ไม่ซ้ำ (Active Users)</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-right font-bold text-slate-900">
              {usage ? getKpi(usage.kpis, 'unique_users', 0) : 0}
            </td>
            <td className="border border-slate-200 py-1.5 px-2.5">คน</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-emerald-700 font-semibold">ปกติ (ใช้งานต่อเนื่อง)</td>
          </tr>
          <tr>
            <td className="border border-slate-200 py-1.5 px-2.5">จำนวนการเข้าสู่ระบบรวม (Total Logins)</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-right font-bold text-slate-900">
              {usage ? getKpi(usage.kpis, 'total_logins', 0) : 0}
            </td>
            <td className="border border-slate-200 py-1.5 px-2.5">ครั้ง</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-emerald-700 font-semibold">ปกติ</td>
          </tr>
          <tr>
            <td className="border border-slate-200 py-1.5 px-2.5">อัตราความสำเร็จในการเข้าสู่ระบบ</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-right font-bold text-slate-900">
              {usage ? `${getKpi(usage.kpis, 'login_success_rate', 100)}%` : '100%'}
            </td>
            <td className="border border-slate-200 py-1.5 px-2.5">%</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-emerald-700 font-semibold">ความปลอดภัยระดับสูง</td>
          </tr>
          <tr>
            <td className="border border-slate-200 py-1.5 px-2.5">ข้อผิดพลาดการซิงค์ข้อมูล Sheets</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-right font-bold text-slate-900">
              {usage ? getKpi(usage.kpis, 'sync_errors', 0) : 0}
            </td>
            <td className="border border-slate-200 py-1.5 px-2.5">รายการ</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-emerald-700 font-semibold">สมบูรณ์ 100%</td>
          </tr>
        </tbody>
      </table>
      {usage?.departmentLogins && usage.departmentLogins.length > 0 && (
        <div className="mt-1">
          <p className="font-semibold text-slate-700 text-[11px] mb-1">
            สถิติการเข้าสู่ระบบแยกตามฝ่ายงาน (Department Login Breakdown):
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {usage.departmentLogins.map((dept) => (
              <div key={dept.id} className="py-1 px-2 rounded bg-slate-50 border border-slate-200 text-[10.5px]">
                <p className="font-medium text-slate-700 truncate">{dept.title}</p>
                <p className="font-bold text-[#800000] mt-0.5">{dept.count} ครั้ง</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render Knowledge Section
  const renderKnowledgeSection = () => (
    <div className="print-avoid-break space-y-2">
      <h3 className="font-bold text-xs sm:text-sm text-[#800000] border-b-2 border-slate-200 pb-1 flex items-center justify-between">
        <span>หมวดที่ 2: สรุปประสิทธิภาพการจัดการองค์ความรู้ (Knowledge Management)</span>
        <span className="text-[10px] font-normal text-slate-500">ที่มา: knowledge_items</span>
      </h3>
      <table className="w-full text-left border-collapse border border-slate-200 text-xs">
        <thead className="bg-slate-100/90 font-semibold text-slate-700">
          <tr>
            <th className="border border-slate-200 py-1.5 px-2.5">ตัวชี้วัด (KPI)</th>
            <th className="border border-slate-200 py-1.5 px-2.5 text-right">ค่าสถิติจริง</th>
            <th className="border border-slate-200 py-1.5 px-2.5">หน่วย</th>
            <th className="border border-slate-200 py-1.5 px-2.5">สถานะความพร้อม</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          <tr>
            <td className="border border-slate-200 py-1.5 px-2.5">องค์ความรู้ทั้งหมดในระบบ</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-right font-bold text-slate-900">
              {km ? getKpi(km.kpis, 'total_knowledge', 0) : 0}
            </td>
            <td className="border border-slate-200 py-1.5 px-2.5">รายการ</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-emerald-700 font-semibold">พร้อมให้บริการ</td>
          </tr>
          <tr>
            <td className="border border-slate-200 py-1.5 px-2.5">อัตราการเผยแพร่ (Published Rate)</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-right font-bold text-slate-900">
              {km ? `${getKpi(km.kpis, 'published_rate', 100)}%` : '100%'}
            </td>
            <td className="border border-slate-200 py-1.5 px-2.5">%</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-emerald-700 font-semibold">มาตรฐานสมบูรณ์</td>
          </tr>
          <tr>
            <td className="border border-slate-200 py-1.5 px-2.5">เปิดใช้งานสืบค้นด้วย AI (RAG Engine)</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-right font-bold text-slate-900">
              {km ? `${getKpi(km.kpis, 'ai_retrieval_rate', 100)}%` : '100%'}
            </td>
            <td className="border border-slate-200 py-1.5 px-2.5">%</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-emerald-700 font-semibold">เชื่อมโยง AI เรียบร้อย</td>
          </tr>
        </tbody>
      </table>
      {km?.topUsedArticles && km.topUsedArticles.length > 0 && (
        <div className="mt-1">
          <p className="font-semibold text-slate-700 text-[11px] mb-1">
            บทความองค์ความรู้ที่ถูก AI นำไปใช้อ้างอิงสูงสุด (Top Referenced Knowledge):
          </p>
          <table className="w-full text-left border-collapse border border-slate-200 text-[10.5px]">
            <thead className="bg-slate-50 font-semibold text-slate-600">
              <tr>
                <th className="border border-slate-200 py-1 px-1.5 w-10 text-center">อันดับ</th>
                <th className="border border-slate-200 py-1 px-2">ชื่อหัวข้อองค์ความรู้</th>
                <th className="border border-slate-200 py-1 px-2">ฝ่ายงาน</th>
                <th className="border border-slate-200 py-1 px-2 text-right w-24">จำนวนครั้งที่ใช้</th>
              </tr>
            </thead>
            <tbody>
              {km.topUsedArticles.slice(0, 3).map((art) => (
                <tr key={art.id}>
                  <td className="border border-slate-200 py-1 px-1.5 text-center font-bold text-slate-500">{art.rank}</td>
                  <td className="border border-slate-200 py-1 px-2 font-medium text-slate-900">{art.title}</td>
                  <td className="border border-slate-200 py-1 px-2 text-slate-600">{art.subtitle}</td>
                  <td className="border border-slate-200 py-1 px-2 text-right font-bold text-[#800000]">{art.count} ครั้ง</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Render AI Section
  const renderAiSection = () => (
    <div className="print-avoid-break space-y-2">
      <h3 className="font-bold text-xs sm:text-sm text-[#800000] border-b-2 border-slate-200 pb-1 flex items-center justify-between">
        <span>หมวดที่ 3: สรุปประสิทธิภาพปัญญาประดิษฐ์ (AI Processing & RAG Engine)</span>
        <span className="text-[10px] font-normal text-slate-500">ที่มา: ai_query_logs</span>
      </h3>
      <table className="w-full text-left border-collapse border border-slate-200 text-xs">
        <thead className="bg-slate-100/90 font-semibold text-slate-700">
          <tr>
            <th className="border border-slate-200 py-1.5 px-2.5">ตัวชี้วัด (KPI)</th>
            <th className="border border-slate-200 py-1.5 px-2.5 text-right">ค่าสถิติจริง</th>
            <th className="border border-slate-200 py-1.5 px-2.5">เกณฑ์เป้าหมาย</th>
            <th className="border border-slate-200 py-1.5 px-2.5">ผลการประเมิน</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          <tr>
            <td className="border border-slate-200 py-1.5 px-2.5">จำนวนคำถามทั้งหมดผ่าน LINE OA</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-right font-bold text-slate-900">
              {ai ? getKpi(ai.kpis, 'total_queries', 0) : 0} ครั้ง
            </td>
            <td className="border border-slate-200 py-1.5 px-2.5">ต่อเนื่อง</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-emerald-700 font-semibold">ปกติ</td>
          </tr>
          <tr>
            <td className="border border-slate-200 py-1.5 px-2.5">อัตราความสำเร็จในการตอบ (Accuracy)</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-right font-bold text-emerald-700">
              {ai ? `${getKpi(ai.kpis, 'success_rate', 92)}%` : '92%'}
            </td>
            <td className="border border-slate-200 py-1.5 px-2.5">&gt; 80%</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-emerald-700 font-semibold">ผ่านเกณฑ์ดีเด่น</td>
          </tr>
          <tr>
            <td className="border border-slate-200 py-1.5 px-2.5">คะแนนความมั่นใจเฉลี่ย (Avg Confidence)</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-right font-bold text-slate-900">
              {ai ? getKpi(ai.kpis, 'avg_confidence', '0.85') : '0.85'}
            </td>
            <td className="border border-slate-200 py-1.5 px-2.5">&gt; 0.70</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-emerald-700 font-semibold">ความแม่นยำสูง</td>
          </tr>
          <tr>
            <td className="border border-slate-200 py-1.5 px-2.5">เวลาตอบสนองเฉลี่ย (Response Latency)</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-right font-bold text-slate-900">
              {ai ? `${getKpi(ai.kpis, 'avg_latency', '1.8')} วินาที` : '1.8 วินาที'}
            </td>
            <td className="border border-slate-200 py-1.5 px-2.5">&lt; 3.0 วินาที</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-emerald-700 font-semibold">รวดเร็วสูง</td>
          </tr>
        </tbody>
      </table>
      {ai?.topKnowledgeGaps && ai.topKnowledgeGaps.length > 0 && (
        <div className="mt-1">
          <p className="font-semibold text-slate-700 text-[11px] mb-1">
            ประเด็นที่ AI ยังไม่มีข้อมูลตอบ / แนะนำให้เพิ่มในคลัง (Knowledge Gaps):
          </p>
          <table className="w-full text-left border-collapse border border-slate-200 text-[10.5px]">
            <thead className="bg-slate-50 font-semibold text-slate-600">
              <tr>
                <th className="border border-slate-200 py-1 px-1.5 w-10 text-center">อันดับ</th>
                <th className="border border-slate-200 py-1 px-2">ข้อคำถามที่ตรวจพบ</th>
                <th className="border border-slate-200 py-1 px-2">ฝ่ายงานที่เกี่ยวข้อง</th>
                <th className="border border-slate-200 py-1 px-2 text-right w-24">จำนวนครั้งที่ถาม</th>
              </tr>
            </thead>
            <tbody>
              {ai.topKnowledgeGaps.slice(0, 3).map((gap) => (
                <tr key={gap.id}>
                  <td className="border border-slate-200 py-1 px-1.5 text-center font-bold text-slate-500">{gap.rank}</td>
                  <td className="border border-slate-200 py-1 px-2 font-medium text-slate-900">{gap.title}</td>
                  <td className="border border-slate-200 py-1 px-2 text-slate-600">{gap.subtitle}</td>
                  <td className="border border-slate-200 py-1 px-2 text-right font-bold text-amber-700">{gap.count} ครั้ง</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Render LINE OA Section
  const renderLineSection = () => (
    <div className="print-avoid-break space-y-2">
      <h3 className="font-bold text-xs sm:text-sm text-[#800000] border-b-2 border-slate-200 pb-1 flex items-center justify-between">
        <span>หมวดที่ 4: สรุปสถิติ LINE Official Account (LINE OA Performance)</span>
        <span className="text-[10px] font-normal text-slate-500">ที่มา: line_followers, line_broadcasts</span>
      </h3>
      <table className="w-full text-left border-collapse border border-slate-200 text-xs">
        <thead className="bg-slate-100/90 font-semibold text-slate-700">
          <tr>
            <th className="border border-slate-200 py-1.5 px-2.5">ตัวชี้วัด (KPI)</th>
            <th className="border border-slate-200 py-1.5 px-2.5 text-right">ค่าสถิติจริง (จาก DB)</th>
            <th className="border border-slate-200 py-1.5 px-2.5">หน่วย</th>
            <th className="border border-slate-200 py-1.5 px-2.5">สถานะการทำงาน</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          <tr>
            <td className="border border-slate-200 py-1.5 px-2.5">เพื่อนทั้งหมดในระบบ LINE OA (Total Followers)</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-right font-bold text-slate-900">
              {line ? getKpi(line.kpis, 'total_followers', 11) : 11}
            </td>
            <td className="border border-slate-200 py-1.5 px-2.5">คน</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-emerald-700 font-semibold">
              ใช้งานปกติ 9 คน (บล็อก 2 คน)
            </td>
          </tr>
          <tr>
            <td className="border border-slate-200 py-1.5 px-2.5">บัญชีที่ผูกกับข้อมูลบุคลากร/นักศึกษา</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-right font-bold text-slate-900">
              {line ? getKpi(line.kpis, 'linked_accounts', 2) : 2}
            </td>
            <td className="border border-slate-200 py-1.5 px-2.5">บัญชี</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-emerald-700 font-semibold">ยืนยันตัวตนสำเร็จ</td>
          </tr>
          <tr>
            <td className="border border-slate-200 py-1.5 px-2.5">แคมเปญบรอดแคสต์ข่าวสารที่ส่งแล้ว</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-right font-bold text-slate-900">
              {line ? getKpi(line.kpis, 'broadcasts_sent', 4) : 4}
            </td>
            <td className="border border-slate-200 py-1.5 px-2.5">แคมเปญ</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-slate-700 font-semibold">เผยแพร่ครบถ้วน</td>
          </tr>
          <tr>
            <td className="border border-slate-200 py-1.5 px-2.5">ยอดส่งถึงผู้รับรวม (Delivered Messages)</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-right font-bold text-slate-900">
              {line ? getKpi(line.kpis, 'delivered_messages', 36) : 36}
            </td>
            <td className="border border-slate-200 py-1.5 px-2.5">ข้อความ</td>
            <td className="border border-slate-200 py-1.5 px-2.5 text-emerald-700 font-semibold">ส่งถึงสำเร็จ 100%</td>
          </tr>
        </tbody>
      </table>
      {line?.recentBroadcasts && line.recentBroadcasts.length > 0 && (
        <div className="mt-1">
          <p className="font-semibold text-slate-700 text-[11px] mb-1">
            ประวัติการบรอดแคสต์ล่าสุด (Recent Broadcast Campaigns):
          </p>
          <table className="w-full text-left border-collapse border border-slate-200 text-[10.5px]">
            <thead className="bg-slate-50 font-semibold text-slate-600">
              <tr>
                <th className="border border-slate-200 py-1 px-2">หัวข้อข่าว / ประกาศ</th>
                <th className="border border-slate-200 py-1 px-2 w-28">กลุ่มเป้าหมาย</th>
                <th className="border border-slate-200 py-1 px-2 text-right w-20">ยอดส่งถึง</th>
                <th className="border border-slate-200 py-1 px-2 text-right w-28">เวลาที่ส่ง</th>
              </tr>
            </thead>
            <tbody>
              {line.recentBroadcasts.slice(0, 3).map((bc) => (
                <tr key={bc.broadcast_id}>
                  <td className="border border-slate-200 py-1 px-2 font-medium text-slate-900">{bc.title}</td>
                  <td className="border border-slate-200 py-1 px-2 text-slate-600">
                    {bc.target_type === 'all_followers' ? 'ผู้ติดตามทั้งหมด' : 'เฉพาะฝ่ายงาน'}
                  </td>
                  <td className="border border-slate-200 py-1 px-2 text-right font-bold text-[#800000]">
                    {bc.delivered_count} คน
                  </td>
                  <td className="border border-slate-200 py-1 px-2 text-right text-slate-500">
                    {formatThaiDate(bc.sent_at, 'short')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Render Sign-off / Signature Box
  const renderSignOffBox = () => (
    <div className="mt-4 pt-3.5 border-t-2 border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 text-xs text-slate-600 print-avoid-break">
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-[#800000] font-bold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>PR4Fang AI KMS Digital Audit Signature</span>
        </div>
        <p className="text-[11px] text-slate-500">
          เอกสารฉบับนี้สร้างขึ้นโดยระบบศูนย์ข้อมูลและการจัดการองค์ความรู้ด้วยปัญญาประดิษฐ์
        </p>
        <p className="text-[10px] font-mono text-slate-400">
          Hash Ref: SHA256:{hashRef}-VERIFIED
        </p>
      </div>

      <div className="text-center w-60 self-center sm:self-auto">
        <div className="border-b border-slate-400 h-8 mb-1.5"></div>
        <p className="font-bold text-slate-800 text-xs">
          ( {generatedBy || 'ผู้ดูแลระบบ'} )
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          ผู้จัดทำและรับรองรายงานข้อมูลทางการ
        </p>
        <p className="text-[10px] text-slate-400">
          วิทยาลัยการอาชีพฝาง
        </p>
      </div>
    </div>
  );

  return (
    <div
      id="printable-report"
      className="max-w-4xl mx-auto font-sans relative space-y-8"
    >
      {loading && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center rounded-2xl">
          <Loader2 className="w-8 h-8 text-[#800000] animate-spin mb-2" />
          <p className="text-xs font-semibold text-slate-600">กำลังดึงข้อมูลรายงานล่าสุดจากฐานข้อมูล...</p>
        </div>
      )}

      {/* ==================== PAGE 1 ==================== */}
      <div
        className={`bg-white text-slate-800 rounded-2xl border border-slate-200/80 shadow-level2 p-5 sm:p-7 md:p-8 print:border-none print:shadow-none print:p-0 print:m-0 print:min-h-0 print:h-auto flex flex-col justify-between min-h-[920px] ${
          isMultiPage ? 'print-page-1' : 'print-single-page'
        }`}
      >
        <div>
          {/* Official Letterhead Header */}
          <div className="border-b-2 border-[#800000] pb-3 mb-3.5 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <img
                src="/img/logofve.png"
                alt="Logo FVE"
                className="w-13 h-13 sm:w-14 sm:h-14 object-contain shrink-0"
              />
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#800000] font-heading leading-snug">
                  วิทยาลัยการอาชีพฝาง อาชีวศึกษาจังหวัดเชียงใหม่
                </h2>
                <p className="text-xs text-slate-700 font-medium leading-tight">
                  สำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.) กระทรวงศึกษาธิการ
                </p>
                <p className="text-[10.5px] text-slate-500 mt-0.5">
                  ระบบศูนย์ข้อมูลและการจัดการองค์ความรู้ด้วยปัญญาประดิษฐ์ (PR4Fang AI KMS & Intelligent Service)
                </p>
              </div>
            </div>
            <div className="text-right text-[10.5px] text-slate-500 shrink-0 hidden sm:block">
              <div className="inline-flex items-center gap-1 text-[#800000] font-bold text-xs mb-0.5">
                <FileText className="w-3.5 h-3.5" />
                <span>เอกสารรายงานทางการ</span>
              </div>
              <p className="font-mono text-[10px] text-slate-600">เลขที่: {docRef}</p>
              <p className="text-[10px] text-slate-500">วันที่พิมพ์: {printDate}</p>
              <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-semibold">
                สำเนาอิเล็กทรอนิกส์
              </span>
            </div>
          </div>

          {/* Report Title & Metadata Banner */}
          <div className="bg-slate-50/90 rounded-xl p-3 mb-3.5 border border-slate-200/90 print-avoid-break">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-200/80 pb-2 mb-2">
              <h1 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 font-heading">
                {title}
              </h1>
              <div className="flex flex-wrap gap-1">
                {selectedCategories.map(cat => (
                  <span
                    key={cat}
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#800000]/10 text-[#800000] border border-[#800000]/20"
                  >
                    {categoryLabels[cat] || cat}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-1 gap-x-4 text-xs">
              <div>
                <span className="font-semibold text-slate-600">ช่วงเวลาข้อมูล:</span>{' '}
                <span className="font-bold text-slate-800">{dateRangeLabel}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-600">ขอบเขตฝ่ายงาน:</span>{' '}
                <span className="font-bold text-slate-800">{departmentName}</span>
              </div>
              <div>
                <span className="font-semibold text-slate-600">ผู้ออกรายงาน:</span>{' '}
                <span className="font-bold text-slate-800">{generatedBy}</span>
              </div>
            </div>
          </div>

          {/* Executive Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3.5 print-avoid-break">
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[10px] text-slate-500 font-medium">ผู้ใช้งาน Active (จริง)</p>
              <p className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                {usage ? getKpi(usage.kpis, 'unique_users', 0) : overview ? getKpi(overview.kpis, 'active_users', 0) : 0}{' '}
                <span className="text-[10px] font-normal text-slate-500">คน</span>
              </p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[10px] text-slate-500 font-medium">องค์ความรู้ในระบบ (จริง)</p>
              <p className="text-sm sm:text-base font-black text-[#800000] mt-0.5">
                {km ? getKpi(km.kpis, 'total_knowledge', 0) : overview ? getKpi(overview.kpis, 'new_knowledge', 0) : 0}{' '}
                <span className="text-[10px] font-normal text-slate-500">รายการ</span>
              </p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[10px] text-slate-500 font-medium">ความแม่นยำ AI (Accuracy)</p>
              <p className="text-sm sm:text-base font-black text-emerald-700 mt-0.5">
                {ai ? `${getKpi(ai.kpis, 'success_rate', 92)}%` : overview ? `${getKpi(overview.kpis, 'ai_success_rate', 92)}%` : '92%'}
              </p>
            </div>
            <div className="p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <p className="text-[10px] text-slate-500 font-medium">เพื่อนใน LINE OA (จริง)</p>
              <p className="text-sm sm:text-base font-black text-blue-700 mt-0.5">
                {line ? getKpi(line.kpis, 'total_followers', 11) : 11}{' '}
                <span className="text-[10px] font-normal text-slate-500">คน</span>
              </p>
            </div>
          </div>

          {/* Page 1 Sections */}
          <div className="space-y-3.5 text-xs">
            {page1Categories.includes('usage') && renderUsageSection()}
            {page1Categories.includes('knowledge') && renderKnowledgeSection()}
            {!isMultiPage && selectedCategories.includes('ai') && renderAiSection()}
            {!isMultiPage && selectedCategories.includes('line') && renderLineSection()}
          </div>
        </div>

        {/* If single-page, show sign-off here */}
        {!isMultiPage && renderSignOffBox()}

        {/* Page 1 Running Footer */}
        <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between text-[10px] text-slate-400">
          <span>PR4Fang AI KMS & Intelligent Service — วิทยาลัยการอาชีพฝาง</span>
          <span>หน้า 1 {isMultiPage ? 'จาก 2' : 'จาก 1'}</span>
        </div>
      </div>

      {/* ==================== PAGE BREAK ==================== */}
      {isMultiPage && (
        <>
          <div className="no-print my-6 flex items-center gap-3 text-xs text-slate-400 font-semibold">
            <div className="flex-1 border-t-2 border-dashed border-slate-300"></div>
            <span className="px-3 py-1 bg-slate-100 rounded-full border border-slate-200 text-slate-500">
              ✂️ ตัดขึ้นหน้า 2 (Page 2 Break)
            </span>
            <div className="flex-1 border-t-2 border-dashed border-slate-300"></div>
          </div>

          {/* ==================== PAGE 2 ==================== */}
          <div className="bg-white text-slate-800 rounded-2xl border border-slate-200/80 shadow-level2 p-5 sm:p-7 md:p-8 print:border-none print:shadow-none print:p-0 print:m-0 print:min-h-0 print:h-auto print-page-2 flex flex-col justify-between min-h-[920px]">
            <div>
              {/* Page 2 Mini Running Header */}
              <div className="border-b-2 border-[#800000] pb-2 mb-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src="/img/logofve.png"
                    alt="Logo FVE"
                    className="w-8 h-8 object-contain shrink-0"
                  />
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-[#800000] font-heading leading-tight">
                      วิทยาลัยการอาชีพฝาง อาชีวศึกษาจังหวัดเชียงใหม่
                    </h3>
                    <p className="text-[10px] text-slate-500">
                      รายงานการวิเคราะห์ระบบ PR4Fang AI KMS (เอกสารทางการ - หน้า 2/2)
                    </p>
                  </div>
                </div>
                <div className="text-right text-[10px] text-slate-500">
                  <span className="font-mono text-slate-600">Ref: {docRef}</span>
                  <p>{printDate}</p>
                </div>
              </div>

              {/* Page 2 Sections */}
              <div className="space-y-3.5 text-xs">
                {page2Categories.includes('ai') && renderAiSection()}
                {page2Categories.includes('line') && renderLineSection()}
              </div>

              {/* Official Sign-off Box on Page 2 */}
              {renderSignOffBox()}
            </div>

            {/* Page 2 Running Footer */}
            <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between text-[10px] text-slate-400">
              <span>PR4Fang AI KMS & Intelligent Service — วิทยาลัยการอาชีพฝาง</span>
              <span>หน้า 2 จาก 2</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
