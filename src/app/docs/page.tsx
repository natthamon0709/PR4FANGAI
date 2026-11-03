import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'เอกสารและแผนภาพภาคผนวก | PR4Fang AI',
  description: 'เอกสารทางเทคนิคและแผนภาพสถาปัตยกรรมระบบ PR4Fang AI วิทยาลัยการอาชีพฝาง',
};

const appendixItems = [
  {
    id: 1,
    title: 'ภาคผนวก 1: แผนภาพสถาปัตยกรรมระบบ (PR4Fang AI Architecture)',
    desc: 'สถาปัตยกรรม 4 ชั้น: Client / Frontend, Application Gateway, Cloud AI & Database, Infrastructure',
    image: '/docs/images/appendix/01-system-architecture.svg',
    tag: 'Architecture'
  },
  {
    id: 2,
    title: 'ภาคผนวก 2: แผนภาพการเชื่อมต่ออุปกรณ์ฮาร์ดแวร์ (Hardware Architecture Diagram)',
    desc: 'การเชื่อมต่อชุดหุ่นยนต์ต้อนรับ Host PC, ESP32, Touchscreen, Mic Array, Webcam, Servos และระบบคลาวด์',
    image: '/docs/images/appendix/02-hardware-diagram.svg',
    tag: 'Hardware'
  },
  {
    id: 3,
    title: 'ภาคผนวก 3: แผนภาพการทำงานของระบบ AI Assistant (AI Assistant RAG Flowchart)',
    desc: 'กระบวนการตอบคำถาม RAG Workflow: ตรวจจับภาษา, Vector Search, คัดกรองคะแนนความเชื่อมั่น, Fallback',
    image: '/docs/images/appendix/03-ai-rag-flowchart.svg',
    tag: 'AI & RAG'
  },
  {
    id: 4,
    title: 'ภาคผนวก 4: แผนภาพความสัมพันธ์ฐานข้อมูลระบบจริง 35 ตาราง (Full ER Diagram)',
    desc: 'โครงสร้างฐานข้อมูลครอบคลุม 6 กลุ่มโมดูลหลัก 35 ตารางตามสเปก dbdiagram.io พร้อม Foreign Keys ครบถ้วน',
    image: '/docs/images/appendix/04-database-er-diagram.svg',
    tag: 'Database'
  },
  {
    id: 5,
    title: 'ภาคผนวก 5: แผนภาพการเชื่อมต่อ LINE Messaging API และ n8n (Integration Sequence)',
    desc: 'ลำดับขั้นตอนการสื่อสาร Webhook, HMAC-SHA256, n8n Workflow Router และการตอบกลับ Flex Message',
    image: '/docs/images/appendix/05-line-n8n-sequence.svg',
    tag: 'Integration'
  },
  {
    id: 6,
    title: 'ภาคผนวก 6: ตัวอย่างโค้ดการพัฒนาระบบ AI Assistant (Code: RAG Pipeline Engine)',
    desc: 'ซอร์สโค้ด TypeScript ระบบประมวลผลคำถาม ค้นหาข้อมูลบริบท และเชื่อมต่อ Gemini 1.5 Flash API',
    image: '/docs/images/appendix/06-code-ai-rag.svg',
    tag: 'Source Code'
  },
  {
    id: 7,
    title: 'ภาคผนวก 7: ตัวอย่างโค้ดการจัดการฐานข้อมูล MySQL / SQLite (Code: Database Abstraction Layer)',
    desc: 'ซอร์สโค้ดการเชื่อมต่อฐานข้อมูล การทำ Connection Pooling, Transaction Control และ Migration',
    image: '/docs/images/appendix/07-code-database-mysql.svg',
    tag: 'Source Code'
  },
  {
    id: 8,
    title: 'ภาคผนวก 8: ตัวอย่างโค้ดการเชื่อมต่อ API และ n8n (Code: REST API & Webhook Handler)',
    desc: 'ซอร์สโค้ด Next.js API Routes สำหรับรับคำขอจากหุ่นยนต์, การตรวจสอบความถูกต้อง และการซิงค์ข้อมูล',
    image: '/docs/images/appendix/08-code-api-n8n.svg',
    tag: 'Source Code'
  },
  {
    id: 9,
    title: 'ภาคผนวก 9: ตัวอย่างโค้ดการพัฒนาระบบจัดการข้อมูล Admin Dashboard (Code: Full-Stack Interface)',
    desc: 'ซอร์สโค้ดหน้าแดชบอร์ดจัดการคลังความรู้ การซิงค์ Google Sheets CMS และการควบคุมระบบความปลอดภัย',
    image: '/docs/images/appendix/09-code-admin-dashboard.svg',
    tag: 'Source Code'
  }
];

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        {/* Intro Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
          <div className="max-w-3xl space-y-3">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-md">
              Technical Documentation &amp; Appendix
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              เอกสารประกอบรายงานโครงการ PR4Fang AI
            </h2>
            <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
              รวมแผนภาพสถาปัตยกรรมระบบจริง แผนภาพวงจรฮาร์ดแวร์หุ่นยนต์ แผนภาพฐานข้อมูล 35 ตาราง 
              และตัวอย่างซอร์สโค้ดหลักที่ใช้ในโครงการวิจัยพัฒนาหุ่นยนต์ประชาสัมพันธ์อัจฉริยะ
            </p>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="space-y-12">
          {appendixItems.map((item) => (
            <section
              key={item.id}
              id={`appendix-${item.id}`}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Card Header */}
              <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                      {item.tag}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Image 0{item.id}.svg
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                    {item.desc}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={item.image}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    เปิดไฟล์ต้นฉบับ (Vector)
                  </a>
                </div>
              </div>

              {/* Diagram Viewer */}
              <div className="p-4 sm:p-6 bg-slate-100/50 flex items-center justify-center overflow-x-auto">
                <div className="w-full max-w-6xl rounded-xl overflow-hidden border border-slate-200/80 bg-white shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-auto object-contain block hover:scale-[1.01] transition-transform duration-200"
                    loading="lazy"
                  />
                </div>
              </div>
            </section>
          ))}
        </div>
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
