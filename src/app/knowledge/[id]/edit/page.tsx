'use client';
import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import KnowledgeFormPanel from '@/components/knowledge/KnowledgeFormPanel';
import { SessionUser, Department, SubDepartment } from '@/types';
import { KnowledgeItem } from '@/types/knowledge';
import { Loader2 } from 'lucide-react';

export default function EditKnowledgePage() {
  const router = useRouter();
  const params = useParams();
  const knowledgeId = params.id as string;

  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subDepartments, setSubDepartments] = useState<SubDepartment[]>([]);
  const [item, setItem] = useState<KnowledgeItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMetaAndItem() {
      try {
        const [authRes, deptRes, itemRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/departments'),
          fetch(`/api/knowledge/${knowledgeId}`),
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

        if (itemRes.ok) {
          const itemData = await itemRes.json();
          setItem(itemData.item);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadMetaAndItem();
  }, [knowledgeId, router]);

  if (loading || !currentUser || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout
      user={currentUser}
      breadcrumbs={[
        { label: 'จัดการองค์ความรู้', href: '/knowledge' },
        { label: item.title, href: `/knowledge/${item.knowledge_id}` },
        { label: 'แก้ไข' },
      ]}
    >
      <KnowledgeFormPanel
        initialData={item}
        departments={departments}
        subDepartments={subDepartments}
        currentUser={currentUser}
        isEdit={true}
      />
    </DashboardLayout>
  );
}
