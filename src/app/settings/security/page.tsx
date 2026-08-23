'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import SettingsTabNav from '@/components/settings/SettingsTabNav';
import SecurityPolicyForm from '@/components/settings/SecurityPolicyForm';
import { SecurityPolicy } from '@/types/settings';
import { SessionUser } from '@/types';
import { Settings, Loader2 } from 'lucide-react';

export default function SettingsSecurityPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [policy, setPolicy] = useState<SecurityPolicy | null>(null);
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

  const loadPolicy = () => {
    fetch('/api/settings/security')
      .then(res => res.json())
      .then(d => {
        if (d.policy) setPolicy(d.policy);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) loadPolicy();
  }, [user]);

  if (!user || loading || !policy) {
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
        { label: 'นโยบายความปลอดภัย' },
      ]}
    >
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="font-heading font-black text-xl md:text-2xl text-onSurface flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            <span>นโยบายความปลอดภัยระบบ (Security Policies)</span>
          </h1>
          <p className="text-xs md:text-sm text-onSurface-muted mt-0.5">
            ตั้งค่านโยบายรหัสผ่าน การป้องกันล็อกอินผิดพลาด และการหมดเวลา Session
          </p>
        </div>

        <SettingsTabNav isAdmin={user.role === 'administrator'} />

        <SecurityPolicyForm initialPolicy={policy} onSaveSuccess={loadPolicy} />
      </div>
    </DashboardLayout>
  );
}
