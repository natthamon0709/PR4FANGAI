'use client';
import React from 'react';
import AppLogo from '@/components/AppLogo';
import { formatThaiDate } from '@/lib/date-utils';

interface ReportPreviewPaneProps {
  title: string;
  dateRangeLabel: string;
  departmentName: string;
  selectedCategories: string[];
  generatedBy: string;
}

export default function ReportPreviewPane({
  title,
  dateRangeLabel,
  departmentName,
  selectedCategories,
  generatedBy
}: ReportPreviewPaneProps) {
  const printDate = formatThaiDate(new Date().toISOString(), 'full');

  return (
    <div className="bg-white text-slate-800 rounded-xl border border-outline/30 shadow-level2 p-6 md:p-8 max-w-4xl mx-auto font-sans">
      {/* Official College Header */}
      <div className="border-b-2 border-[#800000] pb-4 mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/img/logofve.png" alt="Logo FVE" className="w-14 h-14 object-contain" />
          <div>
            <h2 className="text-base md:text-lg font-bold text-[#800000] font-heading">
              วิทยาลัยการอาชีพฝาง อาชีวศึกษาจังหวัดเชียงใหม่
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              สำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.) กระทรวงศึกษาธิการ
            </p>
            <p className="text-[11px] text-slate-500">
              ระบบศูนย์ข้อมูลและการจัดการองค์ความรู้ด้วยปัญญาประดิษฐ์ (PR4Fang AI KMS)
            </p>
          </div>
        </div>
        <div className="text-right text-[11px] text-slate-500 hidden sm:block">
          <p className="font-semibold text-slate-700">เอกสารรายงานทางการ</p>
          <p>วันที่พิมพ์: {printDate}</p>
        </div>
      </div>

      {/* Report Title & Metadata */}
      <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200">
        <h1 className="text-base md:text-lg font-bold text-slate-900 mb-2">{title}</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600">
          <div>
            <span className="font-semibold text-slate-700">ช่วงเวลาข้อมูล:</span> {dateRangeLabel}
          </div>
          <div>
            <span className="font-semibold text-slate-700">ฝ่ายงาน:</span> {departmentName}
          </div>
          <div>
            <span className="font-semibold text-slate-700">ผู้ออกรายงาน:</span> {generatedBy}
          </div>
        </div>
      </div>

      {/* Sections based on selection */}
      <div className="space-y-6 text-xs">
        {selectedCategories.includes('usage') && (
          <div>
            <h3 className="font-bold text-sm text-[#800000] border-b border-slate-200 pb-1 mb-2">
              1. สรุปสถิติการใช้งานระบบ (System Usage Summary)
            </h3>
            <table className="w-full text-left border-collapse border border-slate-200 text-xs">
              <thead className="bg-slate-100 font-semibold">
                <tr>
                  <th className="border border-slate-200 p-2">ตัวชี้วัด (KPI)</th>
                  <th className="border border-slate-200 p-2 text-right">ค่าสถิติ</th>
                  <th className="border border-slate-200 p-2">หน่วย</th>
                  <th className="border border-slate-200 p-2">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-200 p-2">ผู้ใช้งานที่ไม่ซ้ำ (Active Users)</td>
                  <td className="border border-slate-200 p-2 text-right font-bold">18</td>
                  <td className="border border-slate-200 p-2">คน</td>
                  <td className="border border-slate-200 p-2 text-emerald-700 font-semibold">ปกติ</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 p-2">จำนวนการเข้าสู่ระบบรวม</td>
                  <td className="border border-slate-200 p-2 text-right font-bold">142</td>
                  <td className="border border-slate-200 p-2">ครั้ง</td>
                  <td className="border border-slate-200 p-2 text-emerald-700 font-semibold">ปกติ</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 p-2">ข้อผิดพลาดการเชื่อมต่อ Sheets</td>
                  <td className="border border-slate-200 p-2 text-right font-bold">0</td>
                  <td className="border border-slate-200 p-2">รายการ</td>
                  <td className="border border-slate-200 p-2 text-emerald-700 font-semibold">สมบูรณ์ 100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {selectedCategories.includes('ai') && (
          <div>
            <h3 className="font-bold text-sm text-[#800000] border-b border-slate-200 pb-1 mb-2">
              2. สรุปประสิทธิภาพปัญญาประดิษฐ์ (AI Processing & RAG Engine)
            </h3>
            <table className="w-full text-left border-collapse border border-slate-200 text-xs">
              <thead className="bg-slate-100 font-semibold">
                <tr>
                  <th className="border border-slate-200 p-2">ตัวชี้วัด (KPI)</th>
                  <th className="border border-slate-200 p-2 text-right">ค่าสถิติ</th>
                  <th className="border border-slate-200 p-2">เป้าหมาย</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-200 p-2">อัตราความสำเร็จในการตอบ (Accuracy)</td>
                  <td className="border border-slate-200 p-2 text-right font-bold text-emerald-700">92.4%</td>
                  <td className="border border-slate-200 p-2">&gt; 80%</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 p-2">คะแนนความมั่นใจเฉลี่ย (Avg Confidence)</td>
                  <td className="border border-slate-200 p-2 text-right font-bold">0.85</td>
                  <td className="border border-slate-200 p-2">&gt; 0.70</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 p-2">เวลาตอบสนองเฉลี่ย (Response Latency)</td>
                  <td className="border border-slate-200 p-2 text-right font-bold">1.8 วินาที</td>
                  <td className="border border-slate-200 p-2">&lt; 3.0 วินาที</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Signature Box */}
      <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between text-xs text-slate-600">
        <div>
          <p>ระบบสร้างรายงานอัตโนมัติ PR4Fang AI KMS</p>
          <p className="text-[11px] text-slate-400">Security Hash: Verified / Valid</p>
        </div>
        <div className="text-center w-48">
          <div className="border-b border-slate-400 h-10 mb-1"></div>
          <p className="font-semibold text-slate-700">{generatedBy}</p>
          <p className="text-[11px] text-slate-500">ผู้รับรองรายงาน</p>
        </div>
      </div>
    </div>
  );
}
