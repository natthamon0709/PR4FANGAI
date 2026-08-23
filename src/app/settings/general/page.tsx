'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import SettingsTabNav from '@/components/settings/SettingsTabNav';
import CollegeProfileForm from '@/components/settings/CollegeProfileForm';
import { CollegeProfile } from '@/types/settings';
import { SessionUser } from '@/types';
import { Settings, Loader2 } from 'lucide-react';

export default function SettingsGeneralPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [profile, setProfile] = useState<CollegeProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => {
        if (!res.ok) {
          router.push('/login');
          return null;
        }
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

  const loadProfile = () => {
    fetch('/api/settings/general')
      .then(res => res.json())
      .then(d => {
        if (d.profile) setProfile(d.profile);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  if (!user || loading || !profile) {
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
        { label: 'ข้อมูลทั่วไปของวิทยาลัย' },
      ]}
    >
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="font-heading font-black text-xl md:text-2xl text-onSurface flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            <span>ตั้งค่าระบบและศูนย์ควบคุม (System Settings)</span>
          </h1>
          <p className="text-xs md:text-sm text-onSurface-muted mt-0.5">
            ศูนย์รวมการตั้งค่าระดับระบบ นโยบายความปลอดภัย โครงสร้างฝ่าย และการเชื่อมต่อ
          </p>
        </div>

        <SettingsTabNav isAdmin={user.role === 'administrator'} />

        <CollegeProfileForm initialData={profile} onSaveSuccess={loadProfile} />
      </div>
    </DashboardLayout>
  );
}
