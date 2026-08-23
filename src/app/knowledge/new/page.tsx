'use client';
import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import KnowledgeFormPanel from '@/components/knowledge/KnowledgeFormPanel';
import { SessionUser, Department, SubDepartment } from '@/types';
import { Loader2 } from 'lucide-react';

function NewKnowledgeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefilledTitle = searchParams.get('title') || '';

  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subDepartments, setSubDepartments] = useState<SubDepartment[]>([]);
  const [loading, setLoading] = useState(true);

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
      } finally {
        setLoading(false);
      }
    }
    loadMeta();
  }, [router]);

  if (loading || !currentUser) {
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
        { label: 'เพิ่มองค์ความรู้ใหม่' },
      ]}
    >
      <KnowledgeFormPanel
        initialData={{
          title: prefilledTitle,
          content_type: 'regulation',
          department_id: currentUser.role === 'administrator' ? departments[0]?.department_id : currentUser.department_id,
          sub_department_id: currentUser.sub_department_id,
        }}
        departments={departments}
        subDepartments={subDepartments}
        currentUser={currentUser}
        isEdit={false}
      />
    </DashboardLayout>
  );
}

export default function NewKnowledgePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-surface">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <NewKnowledgeContent />
    </Suspense>
  );
}
