'use client';
import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AppLogo from '@/components/AppLogo';
import AuthButton from '@/components/AuthButton';
import SessionAlert from '@/components/SessionAlert';
import { Lock, CheckCircle2, ArrowLeft } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!token) {
      setError('ไม่พบโทเค็นสำหรับการรีเซ็ตรหัสผ่าน กรุณาขอลิงก์ใหม่');
      return;
    }

    if (newPassword.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword, confirmPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'ไม่สามารถตั้งรหัสผ่านใหม่ได้');
        return;
      }

      setSuccess(data.message || 'ตั้งรหัสผ่านใหม่สำเร็จแล้ว');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      setError('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-card py-8 px-6 sm:px-8 rounded-2xl border border-outline/40 shadow-level2 space-y-5">
      {error && <SessionAlert type="error" message={error} onClose={() => setError('')} />}
      {success && <SessionAlert type="success" message={success} />}

      {!success ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-onSurface mb-1.5">
              รหัสผ่านใหม่ (ความยาวอย่างน้อย 6 ตัวอักษร)
            </label>
            <div className="relative">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full h-12 pl-10 pr-4 rounded-lg border border-outline bg-surface-card text-onSurface text-sm focus:ring-2 focus:ring-primary font-mono"
              />
              <Lock className="w-4 h-4 absolute left-3.5 top-4 text-onSurface-muted" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-onSurface mb-1.5">
              ยืนยันรหัสผ่านใหม่อีกครั้ง
            </label>
            <div className="relative">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full h-12 pl-10 pr-4 rounded-lg border border-outline bg-surface-card text-onSurface text-sm focus:ring-2 focus:ring-primary font-mono"
              />
              <Lock className="w-4 h-4 absolute left-3.5 top-4 text-onSurface-muted" />
            </div>
          </div>

          <div className="pt-2">
            <AuthButton type="submit" loading={loading}>
              <CheckCircle2 className="w-4 h-4" />
              <span>บันทึกรหัสผ่านใหม่</span>
            </AuthButton>
          </div>
        </form>
      ) : (
        <div className="pt-2 text-center">
          <Link href="/login" className="w-full block">
            <AuthButton variant="primary">
              ไปยังหน้าเข้าสู่ระบบทันที
            </AuthButton>
          </Link>
        </div>
      )}

      <div className="pt-4 border-t border-outline/20 text-center">
        <Link
          href="/login"
          className="text-xs font-semibold text-primary hover:underline flex items-center justify-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>กลับสู่หน้าเข้าสู่ระบบ</span>
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-surface">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <AppLogo size="lg" showSubtitle={false} />
          </div>
          <h1 className="text-xl font-heading font-bold text-primary">
            ตั้งรหัสผ่านใหม่ (Reset Password)
          </h1>
          <p className="text-xs text-onSurface-variant">
            กำหนดรหัสผ่านใหม่สำหรับเข้าใช้งานระบบ PR4Fang AI
          </p>
        </div>

        <Suspense fallback={
          <div className="py-12 text-center text-onSurface-muted">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs">กำลังโหลด...</p>
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
