'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import KnowledgeTypeTabs from '@/components/knowledge/KnowledgeTypeTabs';
import KnowledgeSearchBar from '@/components/knowledge/KnowledgeSearchBar';
import KnowledgeFilterGroup from '@/components/knowledge/KnowledgeFilterGroup';
import KnowledgeTable from '@/components/knowledge/KnowledgeTable';
import ArchiveConfirmDialog from '@/components/knowledge/ArchiveConfirmDialog';
import SessionAlert from '@/components/SessionAlert';
import { SessionUser, Department, SubDepartment } from '@/types';
import { ContentType, KnowledgeItem } from '@/types/knowledge';
import { PlusCircle, Archive, BookOpen, Loader2 } from 'lucide-react';

export default function KnowledgeListPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subDepartments, setSubDepartments] = useState<SubDepartment[]>([]);
  
  // Query Filters
  const [activeType, setActiveType] = useState<ContentType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedSubDept, setSelectedSubDept] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [page, setPage] = useState(1);

  // Data & Loading
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Archive Modal State
  const [targetArchiveItem, setTargetArchiveItem] = useState<KnowledgeItem | null>(null);

  // 1. Initial Me & Departments
  useEffect(() => {
    async function loadMeta() {
      try {
        const [authRes, deptRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/departments'),
        ]);

        if (!authRes.ok) {
          router.push('/login');
          return;
        }

        const authData = await authRes.json();
        setCurrentUser(authData.user);

        if (deptRes.ok) {
          const deptData = await deptRes.json();
          setDepartments(deptData.departments || []);
          setSubDepartments(deptData.subDepartments || []);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadMeta();
  }, [router]);

  // 2. Fetch Knowledge Items
  const loadKnowledge = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeType !== 'all') params.set('type', activeType);
      if (search) params.set('search', search);
      if (selectedDept !== 'all') params.set('department_id', selectedDept);
      if (selectedSubDept !== 'all') params.set('sub_department_id', selectedSubDept);
      if (selectedStatus !== 'all') params.set('status', selectedStatus);
      params.set('page', page.toString());
      params.set('limit', '10');

      const res = await fetch(`/api/knowledge?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setTypeCounts(data.typeCounts || {});
      }
    } catch (e: any) {
      setAlertMsg({ type: 'error', text: 'โหลดข้อมูลล้มเหลว: ' + e.message });
    } finally {
      setLoading(false);
    }
  }, [activeType, search, selectedDept, selectedSubDept, selectedStatus, page]);

  useEffect(() => {
    if (currentUser) {
      loadKnowledge();
    }
  }, [currentUser, loadKnowledge]);

  const handleArchiveConfirm = async () => {
    if (!targetArchiveItem) return;
    try {
      const newStatus = targetArchiveItem.status === 'archived' ? 'published' : 'archived';
      const res = await fetch(`/api/knowledge/${targetArchiveItem.knowledge_id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setAlertMsg({
          type: 'success',
          text: newStatus === 'archived'
            ? 'เก็บองค์ความรู้เข้าคลังเก็บถาวรเรียบร้อยแล้ว'
            : 'เผยแพร่องค์ความรู้อีกครั้งเรียบร้อยแล้ว',
        });
        setTargetArchiveItem(null);
        loadKnowledge();
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
      breadcrumbs={[{ label: 'จัดการองค์ความรู้' }]}
    >
      <div className="space-y-5 animate-fadeIn">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline/20">
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-extrabold text-onSurface flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-primary" />
              <span>ศูนย์จัดการองค์ความรู้ (Knowledge Management)</span>
            </h1>
            <p className="text-xs text-onSurface-muted mt-0.5">
              คลังข้อมูลองค์ความรู้ 8 ประเภทสำหรับระบบ AI Assistant วิทยาลัยการอาชีพฝาง
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/knowledge/archived"
              className="h-10 px-3.5 rounded-xl border border-outline bg-surface-card hover:bg-surface-variant text-xs font-semibold text-onSurface flex items-center gap-1.5 transition-colors shadow-sm"
              title="ดูคลังองค์ความรู้ที่เก็บถาวร"
            >
              <Archive className="w-4 h-4 text-onSurface-muted" />
              <span>คลังเก็บถาวร</span>
            </Link>

            <Link
              href="/knowledge/new"
              className="h-10 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-heading font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ เพิ่มองค์ความรู้ใหม่</span>
            </Link>
          </div>
        </div>

        {alertMsg && (
          <SessionAlert
            type={alertMsg.type}
            message={alertMsg.text}
            onClose={() => setAlertMsg(null)}
          />
        )}

        {/* 1. 8-Type Tabs (C33) */}
        <KnowledgeTypeTabs
          activeType={activeType}
          onTypeChange={(type) => {
            setActiveType(type);
            setPage(1);
          }}
          typeCounts={typeCounts}
        />

        {/* 2. Search & Multi-criteria Filters Row (C34 & C35) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-surface-card p-3 rounded-2xl border border-outline/30 shadow-level1">
          <KnowledgeSearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setPage(1);
            }}
            className="w-full lg:max-w-md"
          />

          <KnowledgeFilterGroup
            departments={departments}
            subDepartments={subDepartments}
            selectedDept={selectedDept}
            selectedSubDept={selectedSubDept}
            selectedStatus={selectedStatus}
            onDeptChange={(deptId) => {
              setSelectedDept(deptId);
              setSelectedSubDept('all');
              setPage(1);
            }}
            onSubDeptChange={(subDeptId) => {
              setSelectedSubDept(subDeptId);
              setPage(1);
            }}
            onStatusChange={(status) => {
              setSelectedStatus(status);
              setPage(1);
            }}
            isAdmin={isAdmin}
          />
        </div>

        {/* 3. Knowledge Table / Mobile Cards (C36) */}
        {loading ? (
          <div className="p-12 text-center bg-surface-card rounded-2xl border border-outline/30 flex flex-col items-center justify-center space-y-2 text-onSurface-muted">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <p className="text-xs">กำลังโหลดรายการองค์ความรู้...</p>
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

        {/* Archive Confirmation Dialog (C48) */}
        <ArchiveConfirmDialog
          isOpen={Boolean(targetArchiveItem)}
          onClose={() => setTargetArchiveItem(null)}
          onConfirm={handleArchiveConfirm}
          title={targetArchiveItem?.title || ''}
          isArchiving={targetArchiveItem?.status !== 'archived'}
        />
      </div>
    </DashboardLayout>
  );
}
