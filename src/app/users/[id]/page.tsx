'use client';
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import RoleBadge from '@/components/RoleBadge';
import { User, SessionUser } from '@/types';
import { User as UserIcon, Mail, Phone, Building, Calendar, Clock, Edit2, ArrowLeft, MessageSquare, Shield } from 'lucide-react';

export default function UserDetailPage() {
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

  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`;

  return (
    <DashboardLayout
      user={currentUser}
      breadcrumbs={[
        { label: 'จัดการผู้ใช้งาน', href: '/users' },
        { label: `${user.first_name} ${user.last_name}` },
      ]}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center font-heading font-bold text-2xl shadow-sm">
              {initials}
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold text-onSurface">
                {user.first_name} {user.last_name}
              </h1>
              <p className="text-xs text-onSurface-muted font-mono">{user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <RoleBadge role={user.role} />
                <StatusBadge status={user.status} />
              </div>
            </div>
          </div>

          {currentUser.role === 'administrator' && (
            <Link
              href={`/users/${user.user_id}/edit`}
              className="h-10 px-4 rounded-lg bg-secondary hover:bg-secondary-dark text-white text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>แก้ไขข้อมูล</span>
            </Link>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Work Affiliation */}
          <div className="p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 space-y-4">
            <h3 className="font-heading font-bold text-base text-onSurface flex items-center gap-2 pb-3 border-b border-outline/20">
              <Building className="w-4 h-4 text-primary" />
              <span>ข้อมูลสังกัดและบทบาท</span>
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-onSurface-muted">ฝ่าย (Department)</p>
                <p className="font-medium text-onSurface">{user.department_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-onSurface-muted">งาน (Sub-department)</p>
                <p className="font-medium text-onSurface">{user.sub_department_name || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-onSurface-muted">สิทธิ์การใช้งาน (Role)</p>
                <p className="font-medium text-onSurface capitalize">{user.role}</p>
              </div>
            </div>
          </div>

          {/* Contact & Integrations */}
          <div className="p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 space-y-4">
            <h3 className="font-heading font-bold text-base text-onSurface flex items-center gap-2 pb-3 border-b border-outline/20">
              <Phone className="w-4 h-4 text-primary" />
              <span>ช่องทางติดต่อ & เชื่อมโยง AI</span>
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-onSurface-muted">เบอร์โทรศัพท์</p>
                <p className="font-mono text-onSurface">{user.phone || 'ไม่ได้ระบุ'}</p>
              </div>
              <div>
                <p className="text-xs text-onSurface-muted">LINE User ID (Phase 6 / AI LINE OA)</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <MessageSquare className="w-4 h-4 text-[#06C755]" />
                  <span className="font-mono text-xs text-onSurface">
                    {user.line_user_id || 'ยังไม่ได้ผูกบัญชี LINE'}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-onSurface-muted">สถานะการเข้าสู่ระบบล่าสุด</p>
                <p className="font-mono text-xs text-onSurface-muted">
                  {user.last_login_at || 'ยังไม่เคยเข้าสู่ระบบ'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="pt-2">
          <Link
            href="/users"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับสู่หน้ารายชื่อผู้ใช้งาน</span>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
