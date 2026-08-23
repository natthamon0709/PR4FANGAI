'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AppLogo from '@/components/AppLogo';
import AuthButton from '@/components/AuthButton';
import SessionAlert from '@/components/SessionAlert';
import { Mail, Lock, Eye, EyeOff, HelpCircle, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('กรุณากรอกอีเมลและรหัสผ่าน');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'เข้าสู่ระบบไม่สำเร็จ');
        return;
      }

      if (data.user?.role === 'administrator') {
        router.push('/users');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch (err: any) {
      setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick fill demo helper
  const handleFillDemo = (type: 'admin' | 'staff' | 'suspended') => {
    if (type === 'admin') {
      setEmail('admin@fang.ac.th');
      setPassword('Admin@12345');
    } else if (type === 'staff') {
      setEmail('somchai@fang.ac.th');
      setPassword('Fang@2026');
    } else if (type === 'suspended') {
      setEmail('wichai@fang.ac.th');
      setPassword('Fang@2026');
    }
    setError('');
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-surface">
      {/* Container matching Wireframe 4.1 & High Fidelity Mockup */}
      <div className="max-w-md w-full space-y-6">
        {/* Top Logo & Title */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <AppLogo size="lg" showSubtitle={false} />
          </div>
          <h1 className="text-2xl font-heading font-extrabold text-primary tracking-tight">
            PR4Fang AI
          </h1>
          <p className="text-sm font-medium text-onSurface-variant">
            ระบบจัดการองค์ความรู้ วิทยาลัยการอาชีพฝาง
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-surface-card py-8 px-6 sm:px-8 rounded-2xl border border-outline/40 shadow-level2 space-y-6">
          <div className="border-b border-outline/20 pb-4">
            <h2 className="text-lg font-heading font-bold text-onSurface">
              เข้าสู่ระบบ (Sign In)
            </h2>
            <p className="text-xs text-onSurface-muted mt-0.5">
              ใช้บัญชีอีเมลวิทยาลัยการอาชีพฝางเพื่อเข้าใช้งาน
            </p>
          </div>

          {error && (
            <SessionAlert
              type="error"
              message={error}
              onClose={() => setError('')}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-onSurface mb-1.5">
                อีเมล / ชื่อผู้ใช้งาน
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@fang.ac.th"
                  className="w-full h-12 pl-10 pr-4 rounded-lg border border-outline bg-surface-card text-onSurface text-sm placeholder:text-onSurface-muted/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono transition-all"
                />
                <Mail className="w-4 h-4 absolute left-3.5 top-4 text-onSurface-muted" />
              </div>
            </div>

            {/* Password Field with Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-onSurface">
                  รหัสผ่าน
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-primary hover:text-primary-dark hover:underline"
                >
                  ลืมรหัสผ่าน?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full h-12 pl-10 pr-11 rounded-lg border border-outline bg-surface-card text-onSurface text-sm placeholder:text-onSurface-muted/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all font-mono"
                />
                <Lock className="w-4 h-4 absolute left-3.5 top-4 text-onSurface-muted" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-onSurface-muted hover:text-onSurface p-0.5"
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-onSurface-variant cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-outline text-primary focus:ring-primary"
                />
                <span>จดจำฉันไว้ในระบบ</span>
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <AuthButton type="submit" loading={loading}>
                เข้าสู่ระบบ
              </AuthButton>
            </div>
          </form>

          {/* Quick Demo Selector */}
          <div className="pt-4 border-t border-outline/20">
            <p className="text-[11px] font-semibold text-onSurface-muted mb-2 uppercase tracking-wider text-center">
              บัญชีทดสอบระบบ (Demo Accounts)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('admin')}
                className="px-2 py-1.5 rounded-lg border border-secondary/40 bg-secondary-container/30 hover:bg-secondary-container/60 text-[11px] font-bold text-secondary-dark transition-colors text-center"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('staff')}
                className="px-2 py-1.5 rounded-lg border border-primary/30 bg-primary-container/30 hover:bg-primary-container/60 text-[11px] font-bold text-primary transition-colors text-center"
              >
                Staff
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('suspended')}
                className="px-2 py-1.5 rounded-lg border border-error/30 bg-error-container/30 hover:bg-error-container/60 text-[11px] font-bold text-error transition-colors text-center"
              >
                Suspended
              </button>
            </div>
          </div>

          {/* Support Info */}
          <div className="pt-2 text-center">
            <p className="text-xs text-onSurface-muted flex items-center justify-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>ปัญหาการเข้าใช้งาน ติดต่องานศูนย์ดิจิทัลและสื่อสารองค์กร</span>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-onSurface-muted">
          © วิทยาลัยการอาชีพฝาง 2569 — ระบบต้นแบบ Phase 1
        </p>
      </div>
    </div>
  );
}
