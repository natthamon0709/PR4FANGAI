'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import AuthButton from '@/components/AuthButton';
import SessionAlert from '@/components/SessionAlert';
import { SessionUser } from '@/types';
import { FileSpreadsheet, Bot, ExternalLink, RefreshCw, CheckCircle2, ShieldAlert, Copy, Check, Zap } from 'lucide-react';

export default function IntegrationsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const googleSheetUrl = 'https://docs.google.com/spreadsheets/d/1-zp32f6bkCcXpGo5O__moHCAXcm_Sjg0rTPRkTK6fYs/edit?gid=547794364#gid=547794364';
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

  const handleSyncSheets = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await fetch('/api/integrations/google-sheets/sync', {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({
          type: 'success',
          text: `ซิงค์ข้อมูล ${data.recordsCount} รายการไปยัง Google Sheets เรียบร้อยแล้ว (One-way Sync)`,
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'ซิงค์ข้อมูลไม่สำเร็จ' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSyncing(false);
    }
  };

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
            การเชื่อมต่อ Google Sheets & n8n AI
          </h1>
          <p className="text-xs text-onSurface-muted mt-0.5">
            บริหารจัดการการซิงค์ข้อมูลไปยัง Google Sheets และการเชื่อมต่อ AI Workflow ผ่าน n8n
          </p>
        </div>

        {message && (
          <SessionAlert
            type={message.type}
            message={message.text}
            onClose={() => setMessage(null)}
          />
        )}

        {/* Card 1: Google Sheets Sync */}
        <div className="p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-success-container text-success flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-heading font-bold text-onSurface">
                  Google Sheets "Master Users"
                </h3>
                <p className="text-xs text-onSurface-muted">
                  ฐานข้อมูลบัญชีผู้ใช้สำหรับ Phase 4 (CMS) และ Phase 5 (AI Processing)
                </p>
              </div>
            </div>

            <a
              href={googleSheetUrl}
              target="_blank"
              rel="noreferrer"
              className="h-9 px-3 rounded-lg border border-outline bg-surface hover:bg-surface-variant text-xs font-semibold text-primary flex items-center gap-1.5 transition-colors"
            >
              <span>เปิด Sheet</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-variant/50 border border-outline/30 space-y-2 text-xs font-mono">
            <div>
              <span className="text-onSurface-muted font-sans">Spreadsheet ID: </span>
              <span className="font-bold text-onSurface">1-zp32f6bkCcXpGo5O__moHCAXcm_Sjg0rTPRkTK6fYs</span>
            </div>
            <div>
              <span className="text-onSurface-muted font-sans">GID: </span>
              <span className="font-bold text-onSurface">547794364</span>
            </div>
            <div>
              <span className="text-onSurface-muted font-sans">โหมดการซิงค์: </span>
              <span className="font-bold text-primary font-sans">One-way Sync (Database → Google Sheets)</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-onSurface-muted">
              *ข้อมูลจะถูกส่งออกไปอัปเดตชีต Master Users เพื่อให้ AI ตรวจสอบสิทธิ์ผู้ใช้
            </p>
            <AuthButton
              onClick={handleSyncSheets}
              loading={syncing}
              fullWidth={false}
              className="px-5"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              <span>ซิงค์ข้อมูลไปยัง Sheet ตอนนี้</span>
            </AuthButton>
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
