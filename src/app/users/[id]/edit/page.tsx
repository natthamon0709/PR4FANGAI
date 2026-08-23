'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import UserFormPanel from '@/components/UserFormPanel';
import { User, SessionUser } from '@/types';

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const authRes = await fetch('/api/auth/me');
        if (!authRes.ok) {
          router.push('/login');
          return;
        }
        const authData = await authRes.json();
        if (authData.user.role !== 'administrator' && authData.user.user_id !== userId) {
          router.push('/dashboard');
          return;
        }
        setCurrentUser(authData.user);

        const userRes = await fetch(`/api/users/${userId}`);
        if (userRes.ok) {
          const data = await userRes.json();
          setUser(data.user);
        } else {
          router.push('/users');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [userId, router]);

  if (loading || !currentUser || !user) {
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
        { label: `แก้ไข: ${user.first_name} ${user.last_name}` },
      ]}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-onSurface">
            แก้ไขข้อมูลผู้ใช้งาน
          </h1>
          <p className="text-xs text-onSurface-muted mt-0.5">
            อัปเดตข้อมูลส่วนตัว ฝ่าย สิทธิ์ หรือสถานะการใช้งาน
          </p>
        </div>

        <UserFormPanel initialData={user} isEdit={true} />
      </div>
    </DashboardLayout>
  );
}
