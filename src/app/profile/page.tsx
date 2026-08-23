'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import StatusBadge from '@/components/StatusBadge';
import RoleBadge from '@/components/RoleBadge';
import AuthButton from '@/components/AuthButton';
import SessionAlert from '@/components/SessionAlert';
import AccountLinkCodeCard from '@/components/line/AccountLinkCodeCard';
import { SessionUser } from '@/types';
import { User, Mail, Phone, Building, Key, MessageSquare, Save } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    line_user_id: '',
  });

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setCurrentUser(data.user);
        setFormData({
          first_name: data.user.first_name || '',
          last_name: data.user.last_name || '',
          phone: data.user.phone || '',
          line_user_id: data.user.line_user_id || '',
        });
      } catch (e) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/users/${currentUser.user_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว' });
      } else {
        setMessage({ type: 'error', text: data.error || 'เกิดข้อผิดพลาดในการบันทึก' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const initials = `${currentUser.first_name?.[0] || ''}${currentUser.last_name?.[0] || ''}`;

  return (
    <DashboardLayout
      user={currentUser}
      breadcrumbs={[{ label: 'โปรไฟล์ของฉัน' }]}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-onSurface">
            โปรไฟล์ของฉัน (My Profile)
          </h1>
          <p className="text-xs text-onSurface-muted mt-0.5">
            จัดการข้อมูลส่วนตัวและช่องทางการเชื่อมต่อ LINE OA
          </p>
        </div>

        {message && (
          <SessionAlert
            type={message.type}
            message={message.text}
            onClose={() => setMessage(null)}
          />
        )}

        {/* Profile Card */}
        <div className="p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center font-heading font-bold text-2xl shadow-sm">
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-heading font-bold text-onSurface">
                {currentUser.first_name} {currentUser.last_name}
              </h2>
              <p className="text-xs text-onSurface-muted font-mono">{currentUser.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <RoleBadge role={currentUser.role} />
                <StatusBadge status={currentUser.status} />
              </div>
            </div>
          </div>

          <Link
            href="/profile/change-password"
            className="h-10 px-4 rounded-lg bg-surface-variant hover:bg-outline/30 text-onSurface text-xs font-semibold flex items-center gap-2 transition-colors border border-outline/40"
          >
            <Key className="w-3.5 h-3.5 text-secondary" />
            <span>เปลี่ยนรหัสผ่าน</span>
          </Link>
        </div>

        {/* Form Edit */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 space-y-4">
            <h3 className="font-heading font-bold text-base text-onSurface pb-3 border-b border-outline/20">
              ข้อมูลส่วนตัว
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-onSurface mb-1.5">ชื่อ</label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  required
                  className="w-full h-12 px-3.5 rounded-lg border border-outline bg-surface-card text-onSurface text-sm focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-onSurface mb-1.5">นามสกุล</label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  required
                  className="w-full h-12 px-3.5 rounded-lg border border-outline bg-surface-card text-onSurface text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-onSurface mb-1.5">อีเมล (ID หลัก)</label>
                <input
                  type="email"
                  value={currentUser.email}
                  disabled
                  className="w-full h-12 px-3.5 rounded-lg border border-outline bg-surface-variant/60 text-onSurface-muted text-sm font-mono cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-onSurface mb-1.5">เบอร์โทรศัพท์</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="เช่น 0812345678"
                  className="w-full h-12 px-3.5 rounded-lg border border-outline bg-surface-card text-onSurface text-sm font-mono focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-onSurface mb-1.5">
                LINE User ID (Phase 6 / AI LINE OA)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.line_user_id}
                  onChange={(e) => setFormData({ ...formData, line_user_id: e.target.value })}
                  placeholder="เช่น U1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6"
                  className="w-full h-12 pl-10 pr-3.5 rounded-lg border border-outline bg-surface-card text-onSurface text-sm font-mono focus:ring-2 focus:ring-primary"
                />
                <MessageSquare className="w-4 h-4 absolute left-3.5 top-4 text-[#06C755]" />
              </div>
              <p className="text-[11px] text-onSurface-muted mt-1">
                ผูกกับ LINE OA ของวิทยาลัยการอาชีพฝาง เพื่อให้ AI ตอบคำถามตามสิทธิ์ฝ่าย/งานของคุณอัตโนมัติ
              </p>
            </div>
          </div>

          {/* Read-only Affiliation */}
          <div className="p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 space-y-3">
            <h3 className="font-heading font-bold text-base text-onSurface pb-2 border-b border-outline/20">
              สังกัดและสิทธิ์ (อ่านอย่างเดียว)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-surface-variant/40 rounded-xl">
                <p className="text-xs text-onSurface-muted">ฝ่าย</p>
                <p className="font-semibold text-onSurface mt-0.5">{currentUser.department_name}</p>
              </div>
              <div className="p-3 bg-surface-variant/40 rounded-xl">
                <p className="text-xs text-onSurface-muted">งาน</p>
                <p className="font-semibold text-onSurface mt-0.5">{currentUser.sub_department_name}</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <AuthButton type="submit" loading={saving} fullWidth={false} className="px-6">
              <Save className="w-4 h-4" />
              <span>บันทึกข้อมูล</span>
            </AuthButton>
          </div>
        </form>

        {/* Phase 6: LINE Account Linking Card (C81) */}
        <AccountLinkCodeCard
          currentLineUserId={currentUser.line_user_id}
          onLinkSuccess={() => {
            fetch('/api/auth/me')
              .then(r => r.json())
              .then(d => {
                if (d && d.user) {
                  setCurrentUser(d.user);
                  setFormData(prev => ({
                    ...prev,
                    line_user_id: d.user.line_user_id || ''
                  }));
                }
              });
          }}
        />
      </div>
    </DashboardLayout>
  );
}
