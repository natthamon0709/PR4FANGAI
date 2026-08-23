'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import SettingsTabNav from '@/components/settings/SettingsTabNav';
import AuditLogTable from '@/components/settings/AuditLogTable';
import { SystemAuditLog } from '@/types/settings';
import { SessionUser } from '@/types';
import { Settings, Loader2 } from 'lucide-react';

export default function SettingsAuditLogPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [logs, setLogs] = useState<SystemAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string | undefined>();

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

  const loadLogs = (action?: string) => {
    const params = new URLSearchParams();
    if (action) params.set('action', action);

    fetch(`/api/settings/audit-log?${params.toString()}`)
      .then(res => res.json())
      .then(d => {
        if (d.logs) setLogs(d.logs);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user) loadLogs(filterAction);
  }, [user, filterAction]);

  if (!user || loading) {
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
        { label: 'บันทึกกิจกรรมระบบ' },
      ]}
    >
      <div className="space-y-6 pb-12">
        <div>
          <h1 className="font-heading font-black text-xl md:text-2xl text-onSurface flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            <span>บันทึกกิจกรรมระบบ (System Audit Log)</span>
          </h1>
          <p className="text-xs md:text-sm text-onSurface-muted mt-0.5">
            ประวัติการเปลี่ยนแปลงค่าตั้งระบบ โครงสร้างฝ่าย และนโยบายความปลอดภัย
          </p>
        </div>

        <SettingsTabNav isAdmin={user.role === 'administrator'} />

        <AuditLogTable logs={logs} onFilterChange={setFilterAction} />
      </div>
    </DashboardLayout>
  );
}
