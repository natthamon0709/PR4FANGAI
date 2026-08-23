'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import SettingsTabNav from '@/components/settings/SettingsTabNav';
import PersonalNotificationForm from '@/components/settings/PersonalNotificationForm';
import { UserPreferences } from '@/types/settings';
import { SessionUser } from '@/types';
import { UserCheck, Loader2 } from 'lucide-react';

export default function SettingsMyPreferencesPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) { router.push('/login'); return null; }
        return res.json();
      })
      .then(d => {
        if (d && d.user) setUser(d.user);
      });
  }, [router]);

  const loadPreferences = () => {
    fetch('/api/settings/my-preferences')
      .then(res => res.json())
      .then(d => {
        if (d.preferences) setPreferences(d.preferences);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) loadPreferences();
  }, [user]);

  if (!user || loading || !preferences) {
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
        { label: 'การตั้งค่าส่วนตัว' },
      ]}
    >
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="font-heading font-black text-xl md:text-2xl text-onSurface flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-primary" />
            <span>การตั้งค่าส่วนตัว (My Preferences)</span>
          </h1>
          <p className="text-xs md:text-sm text-onSurface-muted mt-0.5">
            ปรับแต่งช่องทางและประเภทการแจ้งเตือนสำหรับบัญชีของคุณ
          </p>
        </div>

        <SettingsTabNav isAdmin={user.role === 'administrator'} />

        <PersonalNotificationForm initialPreferences={preferences} />
      </div>
    </DashboardLayout>
  );
}
