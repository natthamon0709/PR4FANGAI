'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import SettingsTabNav from '@/components/settings/SettingsTabNav';
import DepartmentTreeView from '@/components/settings/DepartmentTreeView';
import { DepartmentTreeNode } from '@/types/settings';
import { SessionUser } from '@/types';
import { Settings, Loader2 } from 'lucide-react';

export default function SettingsDepartmentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [departments, setDepartments] = useState<DepartmentTreeNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) { router.push('/login'); return null; }
        return res.json();
      })
      .then(d => {
        if (d && d.user) {
          if (d.user.role !== 'administrator') {
            router.push('/settings/my-preferences');
            return;
          }
          setUser(d.user);
        }
      });
  }, [router]);

  const loadDepartments = () => {
    fetch('/api/settings/departments')
      .then(res => res.json())
      .then(d => {
        if (d.departments) setDepartments(d.departments);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) loadDepartments();
  }, [user]);

  if (!user || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout
      user={user}
      breadcrumbs={[
        { label: 'การตั้งค่าระบบ', href: '/settings' },
        { label: 'จัดการฝ่ายและงาน' },
      ]}
    >
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="font-heading font-black text-xl md:text-2xl text-onSurface flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            <span>จัดการฝ่ายและงาน (Departments & Sub-departments)</span>
          </h1>
          <p className="text-xs md:text-sm text-onSurface-muted mt-0.5">
            กำหนดโครงสร้างองค์กร 4 ฝ่ายหลักและงานย่อยสำหรับผู้ใช้งานและคลังองค์ความรู้
          </p>
        </div>

        <SettingsTabNav isAdmin={user.role === 'administrator'} />

        <DepartmentTreeView departments={departments} onRefresh={loadDepartments} />
      </div>
    </DashboardLayout>
  );
}
