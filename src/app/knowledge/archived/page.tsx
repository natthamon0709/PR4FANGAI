'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import KnowledgeSearchBar from '@/components/knowledge/KnowledgeSearchBar';
import KnowledgeTable from '@/components/knowledge/KnowledgeTable';
import ArchiveConfirmDialog from '@/components/knowledge/ArchiveConfirmDialog';
import SessionAlert from '@/components/SessionAlert';
import { SessionUser } from '@/types';
import { KnowledgeItem } from '@/types/knowledge';
import { ArrowLeft, Archive, Loader2 } from 'lucide-react';

export default function ArchivedKnowledgePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [targetArchiveItem, setTargetArchiveItem] = useState<KnowledgeItem | null>(null);

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
      }
    }
    loadUser();
  }, [router]);

  const loadArchived = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('status', 'archived');
      params.set('include_archived', 'true');
      if (search) params.set('search', search);
      params.set('page', page.toString());
      params.set('limit', '10');

      const res = await fetch(`/api/knowledge?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (e: any) {
      setAlertMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    if (currentUser) {
      loadArchived();
    }
  }, [currentUser, loadArchived]);

  const handleUnarchive = async () => {
    if (!targetArchiveItem) return;
    try {
      const res = await fetch(`/api/knowledge/${targetArchiveItem.knowledge_id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'published' }),
      });

      if (res.ok) {
        setAlertMsg({ type: 'success', text: 'นำองค์ความรู้ออกจากคลังเก็บถาวรและเผยแพร่อีกครั้งเรียบร้อยแล้ว' });
        setTargetArchiveItem(null);
        loadArchived();
      }
    } catch (e: any) {
      setAlertMsg({ type: 'error', text: e.message });
    }
  };

  if (!currentUser) {
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
        { label: 'คลังเก็บถาวร (Archived)' },
      ]}
    >
      <div className="space-y-5 animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline/20">
          <div>
            <Link
              href="/knowledge"
              className="inline-flex items-center gap-1.5 text-xs text-onSurface-muted hover:text-primary transition-colors mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>กลับสู่รายการองค์ความรู้หลัก</span>
            </Link>
            <h1 className="text-xl md:text-2xl font-heading font-extrabold text-onSurface flex items-center gap-2">
              <Archive className="w-6 h-6 text-error" />
              <span>คลังองค์ความรู้ที่เก็บถาวร (Archived Repository)</span>
            </h1>
            <p className="text-xs text-onSurface-muted mt-0.5">
              รายการที่ถูกเก็บถาวรจะไม่ถูกนำไปใช้ตอบคำถามในระบบ AI จนกว่าจะมีการกู้คืน
            </p>
          </div>
        </div>

        {alertMsg && (
          <SessionAlert
            type={alertMsg.type}
            message={alertMsg.text}
            onClose={() => setAlertMsg(null)}
          />
        )}

        <div className="bg-surface-card p-3 rounded-2xl border border-outline/30 shadow-level1">
          <KnowledgeSearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            placeholder="ค้นหาในคลังเก็บถาวร..."
          />
        </div>

        {loading ? (
          <div className="p-12 text-center bg-surface-card rounded-2xl border border-outline/30 flex flex-col items-center justify-center space-y-2 text-onSurface-muted">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <p className="text-xs">กำลังโหลดคลังเก็บถาวร...</p>
          </div>
        ) : (
          <KnowledgeTable
            items={items}
            total={total}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            onArchiveToggle={(item) => setTargetArchiveItem(item)}
            currentUserId={currentUser.user_id}
            currentUserDeptId={currentUser.department_id}
            isAdmin={isAdmin}
          />
        )}

        <ArchiveConfirmDialog
          isOpen={Boolean(targetArchiveItem)}
          onClose={() => setTargetArchiveItem(null)}
          onConfirm={handleUnarchive}
          title={targetArchiveItem?.title || ''}
          isArchiving={false}
        />
      </div>
    </DashboardLayout>
  );
}
