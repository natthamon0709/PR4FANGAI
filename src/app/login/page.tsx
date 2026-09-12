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
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 bg-surface relative overflow-hidden">
      {/* Ambient background glow for high-end feel */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-primary/12 via-amber-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Container matching Wireframe 4.1 & High Fidelity Mockup */}
      <div className="max-w-md w-full space-y-6 relative z-10 animate-fadeIn">
        {/* Top Logo & Title */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <AppLogo size="lg" showSubtitle={false} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-primary tracking-tight">
            PR4Fang AI
          </h1>
          <p className="text-xs sm:text-sm font-medium text-onSurface-variant">
            ระบบจัดการองค์ความรู้ วิทยาลัยการอาชีพฝาง
          </p>
        </div>

        {/* Card Box with Glassmorphism */}
        <div className="bg-surface-card/95 backdrop-blur-xl py-8 px-6 sm:px-8 rounded-3xl border border-outline/50 shadow-level3 space-y-6">
          <div className="border-b border-outline/30 pb-4">
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
              <label className="block text-xs font-semibold text-onSurface mb-1.5 uppercase tracking-wide">
                อีเมล / ชื่อผู้ใช้งาน
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@fang.ac.th"
                  className="w-full h-12 pl-10 pr-4 rounded-xl border border-outline/70 bg-surface/50 hover:bg-surface/80 focus:bg-white text-onSurface text-sm placeholder:text-onSurface-muted/60 focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary font-mono transition-all duration-150"
                />
                <Mail className="w-4 h-4 absolute left-3.5 top-4 text-onSurface-muted" />
              </div>
            </div>

            {/* Password Field with Toggle */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-onSurface uppercase tracking-wide">
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
                  className="w-full h-12 pl-10 pr-11 rounded-xl border border-outline/70 bg-surface/50 hover:bg-surface/80 focus:bg-white text-onSurface text-sm placeholder:text-onSurface-muted/60 focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary transition-all duration-150 font-mono"
                />
                <Lock className="w-4 h-4 absolute left-3.5 top-4 text-onSurface-muted" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-onSurface-muted hover:text-onSurface p-1 rounded-md transition-colors"
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
                  className="rounded-md border-outline text-primary focus:ring-primary"
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
          <div className="pt-4 border-t border-outline/30">
            <p className="text-[11px] font-mono font-bold text-onSurface-muted mb-2.5 uppercase tracking-wider text-center">
              บัญชีทดสอบระบบ (Demo Accounts)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('admin')}
                className="px-2.5 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-mono font-bold text-amber-700 transition-all active:scale-95 shadow-xs text-center"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('staff')}
                className="px-2.5 py-2 rounded-xl border border-primary/30 bg-primary/10 hover:bg-primary/20 text-xs font-mono font-bold text-primary transition-all active:scale-95 shadow-xs text-center"
              >
                Staff
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('suspended')}
                className="px-2.5 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-xs font-mono font-bold text-red-600 transition-all active:scale-95 shadow-xs text-center"
              >
                Suspended
              </button>
            </div>
          </div>

          {/* Support Info */}
          <div className="pt-2 text-center">
            <p className="text-xs text-onSurface-muted flex items-center justify-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-onSurface-muted/80" />
              <span>ปัญหาการเข้าใช้งาน ติดต่องานศูนย์ดิจิทัลและสื่อสารองค์กร</span>
            </p>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-onSurface-muted">
          © วิทยาลัยการอาชีพฝาง 2569 — ระบบ PR4Fang AI
        </p>
      </div>
    </div>
  );
}
