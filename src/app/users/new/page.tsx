'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import UserFormPanel from '@/components/UserFormPanel';
import { SessionUser } from '@/types';

export default function NewUserPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
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
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  if (authLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout
      user={currentUser}
      breadcrumbs={[
        { label: 'จัดการผู้ใช้งาน', href: '/users' },
        { label: 'เพิ่มผู้ใช้งานใหม่' },
      ]}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-onSurface">
            เพิ่มผู้ใช้งานใหม่ (Add New User)
          </h1>
          <p className="text-xs text-onSurface-muted mt-0.5">
            กรอกข้อมูลเพื่อสร้างบัญชีสำหรับบุคลากรประจำวิทยาลัยการอาชีพฝาง
          </p>
        </div>

        <UserFormPanel />
      </div>
    </DashboardLayout>
  );
}
