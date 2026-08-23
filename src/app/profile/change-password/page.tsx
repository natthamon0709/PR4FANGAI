'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import AuthButton from '@/components/AuthButton';
import SessionAlert from '@/components/SessionAlert';
import { SessionUser } from '@/types';
import { Lock, ArrowLeft, KeyRound } from 'lucide-react';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        setCurrentUser(data.user);
      } catch (e) {
        router.push('/login');
      } finally {
        setLoading(false);
      }
    }
    loadAuth();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
        return;
      }

      setSuccess(data.message || 'เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !currentUser) {
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
        { label: 'โปรไฟล์ของฉัน', href: '/profile' },
        { label: 'เปลี่ยนรหัสผ่าน' },
      ]}
    >
      <div className="max-w-xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-onSurface">
            เปลี่ยนรหัสผ่าน (Change Password)
          </h1>
          <p className="text-xs text-onSurface-muted mt-0.5">
            เพื่อความปลอดภัย กรุณาตั้งรหัสผ่านที่มีความยาวอย่างน้อย 6 ตัวอักษร
          </p>
        </div>

        {error && <SessionAlert type="error" message={error} onClose={() => setError('')} />}
        {success && <SessionAlert type="success" message={success} />}

        <div className="p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-onSurface mb-1.5">
                รหัสผ่านปัจจุบัน <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full h-12 pl-10 pr-4 rounded-lg border border-outline bg-surface-card text-onSurface text-sm font-mono focus:ring-2 focus:ring-primary"
                />
                <KeyRound className="w-4 h-4 absolute left-3.5 top-4 text-onSurface-muted" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-onSurface mb-1.5">
                รหัสผ่านใหม่ <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full h-12 pl-10 pr-4 rounded-lg border border-outline bg-surface-card text-onSurface text-sm font-mono focus:ring-2 focus:ring-primary"
                />
                <Lock className="w-4 h-4 absolute left-3.5 top-4 text-onSurface-muted" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-onSurface mb-1.5">
                ยืนยันรหัสผ่านใหม่อีกครั้ง <span className="text-error">*</span>
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full h-12 pl-10 pr-4 rounded-lg border border-outline bg-surface-card text-onSurface text-sm font-mono focus:ring-2 focus:ring-primary"
                />
                <Lock className="w-4 h-4 absolute left-3.5 top-4 text-onSurface-muted" />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-outline/20">
              <Link
                href="/profile"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>กลับสู่หน้าโปรไฟล์</span>
              </Link>

              <AuthButton type="submit" loading={submitting} fullWidth={false} className="px-6">
                <span>บันทึกรหัสผ่านใหม่</span>
              </AuthButton>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
