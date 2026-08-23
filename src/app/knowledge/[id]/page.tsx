'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import KnowledgeDetailView from '@/components/knowledge/KnowledgeDetailView';
import { SessionUser } from '@/types';
import { KnowledgeItem } from '@/types/knowledge';
import { Loader2 } from 'lucide-react';

export default function KnowledgeDetailPage() {
  const router = useRouter();
  const params = useParams();
  const knowledgeId = params.id as string;

  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [item, setItem] = useState<KnowledgeItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [authRes, itemRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch(`/api/knowledge/${knowledgeId}`),
        ]);

        if (!authRes.ok) {
          router.push('/login');
          return;
        }

        const authData = await authRes.json();
        setCurrentUser(authData.user);

        if (itemRes.ok) {
          const itemData = await itemRes.json();
          setItem(itemData.item);
        } else {
          const err = await itemRes.json();
          setErrorMsg(err.error || 'ไม่พบข้อมูลองค์ความรู้');
        }
      } catch (e: any) {
        setErrorMsg(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [knowledgeId, router]);

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (errorMsg || !item) {
    return (
      <DashboardLayout
        user={currentUser}
        breadcrumbs={[{ label: 'จัดการองค์ความรู้', href: '/knowledge' }, { label: 'เกิดข้อผิดพลาด' }]}
      >
        <div className="p-8 text-center bg-surface-card rounded-2xl border border-outline/30 space-y-3">
          <p className="text-sm font-bold text-error">{errorMsg || 'ไม่พบข้อมูลองค์ความรู้นี้'}</p>
          <button
            onClick={() => router.push('/knowledge')}
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold"
          >
            กลับสู่หน้ารายการ
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const isAdmin = currentUser.role === 'administrator';
  const canEdit = isAdmin || item.department_id === currentUser.department_id;
  const canArchive = isAdmin || item.department_id === currentUser.department_id;

  return (
    <DashboardLayout
      user={currentUser}
      breadcrumbs={[
        { label: 'จัดการองค์ความรู้', href: '/knowledge' },
        { label: item.title },
      ]}
    >
      <KnowledgeDetailView
        item={item}
        canEdit={canEdit}
        canArchive={canArchive}
        currentUserDeptId={currentUser.department_id}
        isAdmin={isAdmin}
      />
    </DashboardLayout>
  );
}
