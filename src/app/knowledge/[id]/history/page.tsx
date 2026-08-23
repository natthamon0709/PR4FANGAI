'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import VersionHistoryPanel from '@/components/knowledge/VersionHistoryPanel';
import SessionAlert from '@/components/SessionAlert';
import { SessionUser } from '@/types';
import { KnowledgeVersion } from '@/types/knowledge';
import { ArrowLeft, Loader2, History } from 'lucide-react';

export default function KnowledgeHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const knowledgeId = params.id as string;

  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [versions, setVersions] = useState<KnowledgeVersion[]>([]);
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [authRes, historyRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch(`/api/knowledge/${knowledgeId}/history`),
        ]);

        if (!authRes.ok) {
          router.push('/login');
          return;
        }

        const authData = await authRes.json();
        setCurrentUser(authData.user);

        if (historyRes.ok) {
          const histData = await historyRes.json();
          setVersions(histData.versions || []);
          setTitle(histData.title || '');
        }
      } catch (e: any) {
        setAlertMsg({ type: 'error', text: e.message });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [knowledgeId, router]);

  const handleRestore = async (versionId: string, versionNo: number) => {
    if (!confirm(`ยืนยันการกู้คืนข้อมูลกลับสู่เวอร์ชัน v${versionNo}?`)) return;

    try {
      const res = await fetch(`/api/knowledge/${knowledgeId}/history/${versionId}/restore`, {
        method: 'POST',
      });

      const data = await res.json();
      if (res.ok) {
        setAlertMsg({ type: 'success', text: data.message });
        // Reload history
        const refreshed = await fetch(`/api/knowledge/${knowledgeId}/history`);
        if (refreshed.ok) {
          const histData = await refreshed.json();
          setVersions(histData.versions || []);
        }
      } else {
        setAlertMsg({ type: 'error', text: data.error });
      }
    } catch (e: any) {
      setAlertMsg({ type: 'error', text: e.message });
    }
  };

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
        { label: 'จัดการองค์ความรู้', href: '/knowledge' },
        { label: title || 'รายละเอียด', href: `/knowledge/${knowledgeId}` },
        { label: 'ประวัติเวอร์ชัน' },
      ]}
    >
      <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
        <div>
          <Link
            href={`/knowledge/${knowledgeId}`}
            className="inline-flex items-center gap-1.5 text-xs text-onSurface-muted hover:text-primary transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับสู่หน้ารายละเอียด</span>
          </Link>
          <h1 className="text-xl md:text-2xl font-heading font-extrabold text-onSurface flex items-center gap-2">
            <History className="w-6 h-6 text-primary" />
            <span>ประวัติเวอร์ชันย้อนหลัง: {title}</span>
          </h1>
        </div>

        {alertMsg && (
          <SessionAlert
            type={alertMsg.type}
            message={alertMsg.text}
            onClose={() => setAlertMsg(null)}
          />
        )}

        <VersionHistoryPanel
          versions={versions}
          onRestore={handleRestore}
          canRestore={true}
        />
      </div>
    </DashboardLayout>
  );
}
