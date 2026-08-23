'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/AppLogo';
import AuthButton from '@/components/AuthButton';
import SessionAlert from '@/components/SessionAlert';
import { Mail, ArrowLeft, Send } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setDemoUrl('');

    if (!email) {
      setError('กรุณากรอกอีเมล');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      setMessage(data.message || 'ส่งลิงก์รีเซ็ตรหัสผ่านเรียบร้อยแล้ว');
      if (data._demoResetUrl) {
        setDemoUrl(data._demoResetUrl);
      }
    } catch (err: any) {
      setError('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-surface">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <AppLogo size="lg" showSubtitle={false} />
          </div>
          <h1 className="text-xl font-heading font-bold text-primary">
            ลืมรหัสผ่าน (Forgot Password)
          </h1>
          <p className="text-xs text-onSurface-variant">
            กรอกอีเมลที่ลงทะเบียนไว้ในระบบ เพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่
          </p>
        </div>

        <div className="bg-surface-card py-8 px-6 sm:px-8 rounded-2xl border border-outline/40 shadow-level2 space-y-5">
          {error && <SessionAlert type="error" message={error} onClose={() => setError('')} />}
          {message && <SessionAlert type="info" message={message} />}

          {demoUrl && (
            <div className="p-3.5 rounded-xl bg-primary-container/40 border border-primary/30 text-xs space-y-2 animate-scaleUp">
              <p className="font-bold text-primary">🔗 ลิงก์สำหรับทดสอบตั้งรหัสผ่านใหม่ (Demo Link):</p>
              <Link
                href={demoUrl}
                className="block text-primary underline font-mono break-all font-medium"
              >
                {demoUrl}
              </Link>
            </div>
          )}

          {!message ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-onSurface mb-1.5">
                  อีเมลของท่าน
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="somchai@fang.ac.th"
                    className="w-full h-12 pl-10 pr-4 rounded-lg border border-outline bg-surface-card text-onSurface text-sm focus:ring-2 focus:ring-primary font-mono"
                  />
                  <Mail className="w-4 h-4 absolute left-3.5 top-4 text-onSurface-muted" />
                </div>
              </div>

              <div className="pt-2">
                <AuthButton type="submit" loading={loading}>
                  <Send className="w-4 h-4" />
                  <span>ส่งลิงก์รีเซ็ตรหัสผ่าน</span>
                </AuthButton>
              </div>
            </form>
          ) : (
            <div className="pt-2">
              <Link href="/login" className="w-full block">
                <AuthButton variant="outline">
                  กลับสู่หน้าเข้าสู่ระบบ
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
      </div>
    </div>
  );
}
