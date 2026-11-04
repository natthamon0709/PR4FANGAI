'use client';

import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  Cpu, 
  Brain, 
  Database, 
  Smartphone, 
  LayoutDashboard, 
  Layers 
} from 'lucide-react';

interface AppendixItem {
  id: number;
  title: string;
  desc: string;
  image: string;
  tag: string;
  category: 'journey' | 'architecture' | 'ai-rag' | 'database' | 'integration' | 'dashboard';
}

const appendixItems: AppendixItem[] = [
  {
    id: 10,
    title: 'ภาพที่ 10: แผนผังการเดินทางของผู้ใช้งานทั้งระบบ PR4Fang AI (End-to-End User Journey Flow)',
    desc: 'Infographic 10 ขั้นตอนแบบ S-Curve ครอบคลุมหุ่นยนต์ Kiosk, AI RAG, LINE OA, และ Web Management Portal',
    image: '/docs/images/appendix/10-user-journey-flow.svg',
    tag: 'User Journey',
    category: 'journey'
  },
  {
    id: 1,
    title: 'ภาคผนวก 1: แผนภาพสถาปัตยกรรมระบบ (PR4Fang AI Architecture)',
    desc: 'สถาปัตยกรรม 4 ชั้น: Client / Frontend, Application Gateway, Cloud AI & Database, Infrastructure',
    image: '/docs/images/appendix/01-system-architecture.svg',
    tag: 'Architecture',
    category: 'architecture'
  },
  {
    id: 2,
    title: 'ภาคผนวก 2: แผนภาพการเชื่อมต่ออุปกรณ์ฮาร์ดแวร์ (Hardware Architecture Diagram)',
    desc: 'การเชื่อมต่อชุดหุ่นยนต์ต้อนรับ Host PC, ESP32, Touchscreen, Mic Array, Webcam, Servos และระบบคลาวด์',
    image: '/docs/images/appendix/02-hardware-diagram.svg',
    tag: 'Hardware',
    category: 'architecture'
  },
  {
    id: 3,
    title: 'ภาคผนวก 3: แผนภาพการทำงานของระบบ AI Assistant (AI Assistant RAG Flowchart)',
    desc: 'กระบวนการตอบคำถาม RAG Workflow: ตรวจจับภาษา, Vector Search, คัดกรองคะแนนความเชื่อมั่น, Fallback',
    image: '/docs/images/appendix/03-ai-rag-flowchart.svg',
    tag: 'AI & RAG',
    category: 'ai-rag'
  },
  {
    id: 4,
    title: 'ภาคผนวก 4: แผนภาพความสัมพันธ์ฐานข้อมูลระบบจริง 35 ตาราง (Full ER Diagram)',
    desc: 'โครงสร้างฐานข้อมูลครอบคลุม 6 กลุ่มโมดูลหลัก 35 ตารางตามสเปก dbdiagram.io พร้อม Foreign Keys ครบถ้วน',
    image: '/docs/images/appendix/04-database-er-diagram.svg',
    tag: 'Database',
    category: 'database'
  },
  {
    id: 5,
    title: 'ภาคผนวก 5: แผนภาพการเชื่อมต่อ LINE Messaging API และ n8n (Integration Sequence)',
    desc: 'ลำดับขั้นตอนการสื่อสาร Webhook, HMAC-SHA256, n8n Workflow Router และการตอบกลับ Flex Message',
    image: '/docs/images/appendix/05-line-n8n-sequence.svg',
    tag: 'Integration',
    category: 'integration'
  },
  {
    id: 6,
    title: 'ภาคผนวก 6: ตัวอย่างโค้ดการพัฒนาระบบ AI Assistant (Code: RAG Pipeline Engine)',
    desc: 'ซอร์สโค้ด TypeScript ระบบประมวลผลคำถาม ค้นหาข้อมูลบริบท และเชื่อมต่อ Gemini 1.5 Flash API',
    image: '/docs/images/appendix/06-code-ai-rag.svg',
    tag: 'Source Code',
    category: 'ai-rag'
  },
  {
    id: 7,
    title: 'ภาคผนวก 7: ตัวอย่างโค้ดการจัดการฐานข้อมูล MySQL / SQLite (Code: Database Abstraction Layer)',
    desc: 'ซอร์สโค้ดการเชื่อมต่อฐานข้อมูล การทำ Connection Pooling, Transaction Control และ Migration',
    image: '/docs/images/appendix/07-code-database-mysql.svg',
    tag: 'Source Code',
    category: 'database'
  },
  {
    id: 8,
    title: 'ภาคผนวก 8: ตัวอย่างโค้ดการเชื่อมต่อ API และ n8n (Code: REST API & Webhook Handler)',
    desc: 'ซอร์สโค้ด Next.js API Routes สำหรับรับคำขอจากหุ่นยนต์, การตรวจสอบความถูกต้อง และการซิงค์ข้อมูล',
    image: '/docs/images/appendix/08-code-api-n8n.svg',
    tag: 'Source Code',
    category: 'integration'
  },
  {
    id: 9,
    title: 'ภาคผนวก 9: ตัวอย่างโค้ดการพัฒนาระบบจัดการข้อมูล Admin Dashboard (Code: Full-Stack Interface)',
    desc: 'ซอร์สโค้ดหน้าแดชบอร์ดจัดการคลังความรู้ การซิงค์ Web CMS และการควบคุมระบบความปลอดภัย',
    image: '/docs/images/appendix/09-code-admin-dashboard.svg',
    tag: 'Source Code',
    category: 'dashboard'
  }
];

const TABS = [
  { id: 'journey', label: 'เส้นทางผู้ใช้ (User Journey)', count: '10 ขั้นตอน', icon: GitBranch },
  { id: 'architecture', label: 'สถาปัตยกรรม & ฮาร์ดแวร์', count: '2 รูป', icon: Cpu },
  { id: 'ai-rag', label: 'AI RAG & ภาษาถิ่น', count: '2 รูป', icon: Brain },
  { id: 'database', label: 'ฐานข้อมูล 35 ตาราง', count: '2 รูป', icon: Database },
  { id: 'integration', label: 'LINE OA & n8n', count: '2 รูป', icon: Smartphone },
  { id: 'dashboard', label: 'Admin Dashboard', count: '1 รูป', icon: LayoutDashboard },
  { id: 'all', label: 'ดูภาพทั้งหมด', count: '10 รูป', icon: Layers },
];

export default function DocsClientView() {
  const [activeTab, setActiveTab] = useState<string>('journey');

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && TABS.some(t => t.id === hash)) {
        setActiveTab(hash);
      } else {
        setActiveTab('journey');
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    window.location.hash = tabId;
  };

  const filteredItems = activeTab === 'all'
    ? appendixItems
    : appendixItems.filter(item => item.category === activeTab);

  return (
    <div className="space-y-8">
      {/* Tab Navigation Bar */}
      <div className="bg-white rounded-2xl p-2 border border-slate-200 shadow-sm overflow-x-auto">
        <nav className="flex space-x-1 min-w-max">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  isActive ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Special Hero Box for Journey Tab */}
      {activeTab === 'journey' && (
        <div className="bg-gradient-to-br from-emerald-800 via-teal-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl space-y-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
              Interactive User Journey #journey
            </span>
            <span className="text-xs text-emerald-300 font-mono">10-Step S-Curve Architecture</span>
          </div>
          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            แผนผังการเดินทางของผู้ใช้งานทั้งระบบ (PR4Fang AI Journey)
          </h3>
          <p className="text-sm sm:text-base text-emerald-100 max-w-4xl leading-relaxed">
            ผังปฏิสัมพันธ์ 10 ขั้นตอนจำลองประสบการณ์จริง เชื่อมโยงผู้ปกครองและนักเรียนเข้ากับหุ่นยนต์ Kiosk (กล้องตรวจจับใบหน้า + Edge TTS ภาษาคำเมือง), 
            ระบบ RAG Gemini ค้นหา 83 เอกสารความรู้, ส่งสรุปข้อมูลเข้า LINE OA ผ่าน Dynamic QR Code, และการเก็บสถิติ Knowledge Gaps เข้า Web Management Portal ของ 4 ฝ่าย 23 งาน
          </p>
        </div>
      )}

      {/* Grid of Appendix / Journey Items */}
      <div className="space-y-12">
        {filteredItems.map(item => (
          <section
            key={item.id}
            id={`appendix-${item.id}`}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Card Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    item.category === 'journey'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {item.tag}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {item.image.split('/').pop()}
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
                  เปิดไฟล์ต้นฉบับ (Vector)
                </a>
                <a
                  href={item.image}
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  ดาวน์โหลดภาพ SVG
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
    </div>
  );
}
