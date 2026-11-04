import React from 'react';
import Link from 'next/link';
import DocsClientView from './DocsClientView';

export const metadata = {
  title: 'เอกสารและแผนภาพภาคผนวก & User Journey | PR4Fang AI',
  description: 'เอกสารทางเทคนิคและแผนภาพสถาปัตยกรรมระบบ PR4Fang AI วิทยาลัยการอาชีพฝาง',
};

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20">
              PR
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                PR4Fang AI — เอกสารและแผนภาพทางเทคนิค
              </h1>
              <p className="text-xs text-slate-500">
                วิทยาลัยการอาชีพฝาง (Fang Industrial and Community Education College)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            >
              เข้าสู่ระบบ Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Intro Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
          <div className="max-w-3xl space-y-3">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md">
              Technical Documentation &amp; Appendix
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              เอกสารประกอบรายงานโครงการ PR4Fang AI
            </h2>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              รวมแผนภาพสถาปัตยกรรมระบบจริง แผนภาพวงจรฮาร์ดแวร์หุ่นยนต์ แผนภาพฐานข้อมูล 35 ตาราง 
              แผนผังเส้นทางผู้ใช้ (User Journey 10 ขั้นตอน) และตัวอย่างซอร์สโค้ดหลัก
            </p>
          </div>
        </div>

        {/* Client Interactive Tab View */}
        <DocsClientView />
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 space-y-1">
          <p>© 2567 โครงการวิจัยและพัฒนา PR4Fang AI — วิทยาลัยการอาชีพฝาง</p>
          <p>เอกสารทางเทคนิคและสถาปัตยกรรมระบบเผยแพร่เพื่อการศึกษาและการตรวจประเมินผลงาน</p>
        </div>
      </footer>
    </div>
  );
}
