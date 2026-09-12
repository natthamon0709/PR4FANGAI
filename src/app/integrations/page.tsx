'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import SessionAlert from '@/components/SessionAlert';
import { SessionUser } from '@/types';
import { Database, CheckCircle2, ShieldCheck, Copy, Check, Zap, Server, HardDrive } from 'lucide-react';

export default function IntegrationsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const apiKey = 'fang_ai_n8n_live_sec_key_2026';

  useEffect(() => {
    async function loadAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (data.user.role !== 'administrator') {
          router.push('/dashboard');
          return;
        }
        setCurrentUser(data.user);
      } catch (e) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    loadAuth();
  }, [router]);

  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout
      user={currentUser}
      breadcrumbs={[{ label: 'Google Sheets & n8n AI' }]}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-onSurface">
            การเชื่อมต่อฐานข้อมูล & n8n AI Webhooks
          </h1>
          <p className="text-xs text-onSurface-muted mt-0.5">
            ระบบทำงานตรงกับฐานข้อมูลหลัก (Direct Database Single Source of Truth) และรองรับการเชื่อมต่อ AI Workflow ผ่าน n8n
          </p>
        </div>

        {message && (
          <SessionAlert
            type={message.type}
            message={message.text}
            onClose={() => setMessage(null)}
          />
        )}

        {/* Card 1: Direct Database Architecture */}
        <div className="p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-heading font-bold text-onSurface flex items-center gap-2">
                  <span>ฐานข้อมูลระบบหลัก (Single Source of Truth)</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    <CheckCircle2 className="w-3 h-3" />
                    Direct DB
                  </span>
                </h3>
                <p className="text-xs text-onSurface-muted">
                  ระบบเชื่อมต่อตรงกับฐานข้อมูลในตัว ไม่ผ่าน Third-party Sync ลดความหน่วงและตัดปัญหาความขัดแย้งของข้อมูล
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-surface-variant/40 border border-outline/20 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-onSurface-muted">
                <Server className="w-3.5 h-3.5 text-primary" />
                <span>Database Engine</span>
              </div>
              <p className="font-bold text-sm text-onSurface font-mono">SQLite 3 (WAL Mode)</p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-variant/40 border border-outline/20 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-onSurface-muted">
                <HardDrive className="w-3.5 h-3.5 text-primary" />
                <span>Storage Path</span>
              </div>
              <p className="font-bold text-sm text-onSurface font-mono">data/pr4fang.db</p>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-variant/40 border border-outline/20 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-onSurface-muted">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Data Integrity</span>
              </div>
              <p className="font-bold text-sm text-emerald-600">ACID Compliant</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-onSurface space-y-1">
            <p className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ระบบเชื่อมต่อตรง 100% (Google Sheets Sync Disconnected)
            </p>
            <p className="text-onSurface-muted text-[11px] leading-relaxed">
              ทุกการทำรายการผ่านหน้าจอเว็บและ LINE OA จะอ่าน-เขียนตรงกับฐานข้อมูลทันที ทำให้มีความเร็วสูงสุดและข้อมูลเป็นปัจจุบันตลอดเวลา
            </p>
          </div>
        </div>

        {/* Card 2: n8n & AI Integration APIs */}
        <div className="p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary-container text-primary flex items-center justify-center flex-shrink-0">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-heading font-bold text-onSurface">
                n8n AI Workflow & LINE OA Integration
              </h3>
              <p className="text-xs text-onSurface-muted">
                API สำหรับ n8n นำไปใช้ใน Phase 5 (AI Engine) และ Phase 6 (LINE OA)
              </p>
            </div>
          </div>

          {/* API Key Box */}
          <div className="p-4 rounded-xl bg-surface-variant/40 border border-outline/30 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-onSurface">n8n Secret API Key (สำหรับเรียก Webhook):</span>
              <button
                onClick={copyApiKey}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                {copiedKey ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey ? 'คัดลอกแล้ว' : 'คัดลอก API Key'}</span>
              </button>
            </div>
            <code className="block p-2.5 rounded-lg bg-surface-card border border-outline/30 font-mono text-xs text-onSurface font-bold">
              {apiKey}
            </code>
          </div>

          {/* Endpoints Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-onSurface uppercase tracking-wider">
              Available REST Endpoints for n8n:
            </h4>
            <div className="space-y-2 text-xs font-mono">
              <div className="p-3 rounded-lg border border-outline/30 bg-surface flex items-start justify-between gap-2">
                <div>
                  <span className="px-1.5 py-0.5 bg-primary text-white rounded text-[10px] font-bold mr-2">POST</span>
                  <span className="font-bold text-onSurface">/api/v1/n8n/verify-line-user</span>
                  <p className="font-sans text-[11px] text-onSurface-muted mt-1">
                    ใช้ตรวจสอบ Role & Department ของบุคลากรที่ทัก LINE OA ด้วย <code className="text-primary font-mono">line_user_id</code>
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg border border-outline/30 bg-surface flex items-start justify-between gap-2">
                <div>
                  <span className="px-1.5 py-0.5 bg-secondary text-white rounded text-[10px] font-bold mr-2">GET</span>
                  <span className="font-bold text-onSurface">/api/v1/n8n/users</span>
                  <p className="font-sans text-[11px] text-onSurface-muted mt-1">
                    ดึงรายชื่อผู้ใช้ที่ Active สำหรับการทำ Scope Filtering ใน AI Processing Engine
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
