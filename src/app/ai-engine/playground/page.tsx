'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import PlaygroundChatWindow from '@/components/ai/PlaygroundChatWindow';
import { SessionUser } from '@/types';
import { Play, Settings, History, Loader2, Sparkles, ShieldCheck } from 'lucide-react';

export default function AiPlaygroundPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setCurrentUser(data.user);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [router]);

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const isAdmin = currentUser.role === 'administrator';

  return (
    <DashboardLayout
      user={currentUser}
      breadcrumbs={[
        { label: 'ระบบปัญญาประดิษฐ์ (AI Engine)' },
        { label: 'ทดสอบ AI (Playground)' },
      ]}
    >
      <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline/20">
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-extrabold text-onSurface flex items-center gap-2.5">
              <Play className="w-6 h-6 text-primary" />
              <span>ทดสอบ AI (Playground Sandbox)</span>
            </h1>
            <p className="text-xs text-onSurface-muted mt-0.5">
              จำลองหน้าต่างแชท LINE Official Account เพื่อทดสอบความแม่นยำของ RAG Pipeline ก่อนเปิดใช้งานจริง
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <Link
                href="/ai-engine/settings"
                className="h-10 px-3.5 rounded-xl border border-outline bg-surface-card hover:bg-surface-variant text-xs font-semibold text-onSurface flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Settings className="w-4 h-4 text-primary" />
                <span>ตั้งค่าเครื่องมือ AI</span>
              </Link>
            )}

            <Link
              href="/ai-logs"
              className="h-10 px-3.5 rounded-xl border border-outline bg-surface-card hover:bg-surface-variant text-xs font-semibold text-onSurface flex items-center gap-1.5 shadow-sm transition-all"
            >
              <History className="w-4 h-4 text-primary" />
              <span>ดู AI Logs</span>
            </Link>
          </div>
        </div>

        {/* Playground Interactive Chat Window (C65) */}
        <PlaygroundChatWindow />
      </div>
    </DashboardLayout>
  );
}
