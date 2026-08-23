'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { SessionUser, LoginAuditLog } from '@/types';
import { ShieldCheck, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Filter } from 'lucide-react';

export default function AuditLogsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [logs, setLogs] = useState<LoginAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const authRes = await fetch('/api/auth/me');
      if (!authRes.ok) {
        router.push('/login');
        return;
      }
      const authData = await authRes.json();
      if (authData.user.role !== 'administrator') {
        router.push('/dashboard');
        return;
      }
      setCurrentUser(authData.user);

      const logsRes = await fetch('/api/audit-logs');
      if (logsRes.ok) {
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getResultBadge = (result: string) => {
    switch (result) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success-container text-success">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>สำเร็จ (Success)</span>
          </span>
        );
      case 'failed_password':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-error-container text-error">
            <XCircle className="w-3.5 h-3.5" />
            <span>รหัสผ่านไม่ถูกต้อง</span>
          </span>
        );
      case 'account_suspended':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary-container text-secondary-dark">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>บัญชีถูกระงับ</span>
          </span>
        );
      case 'account_locked':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-error-container text-error">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>บัญชีถูกล็อก (15m)</span>
          </span>
        );
      default:
        return <span>{result}</span>;
    }
  };

  return (
    <DashboardLayout
      user={currentUser}
      breadcrumbs={[{ label: 'บันทึกการเข้าใช้งานระบบ (Audit Logs)' }]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-heading font-bold text-onSurface">
              บันทึกการเข้าสู่ระบบ (Login Audit Log)
            </h1>
            <p className="text-xs text-onSurface-muted mt-0.5">
              ประวัติการพยายามเข้าใช้งานระบบทั้งหมด เพื่อความปลอดภัยและเป็นข้อมูลตั้งต้น Phase 7
            </p>
          </div>

          <button
            onClick={loadData}
            className="h-10 px-3.5 rounded-lg border border-outline bg-surface-card hover:bg-surface-variant text-xs font-medium text-onSurface flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>รีเฟรช</span>
          </button>
        </div>

        {/* Logs Table */}
        <div className="overflow-x-auto rounded-xl border border-outline/40 bg-surface-card shadow-level1">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-surface-variant text-onSurface-variant font-heading text-xs font-semibold uppercase tracking-wider border-b border-outline/30">
                <th className="py-3 px-4">วัน-เวลา</th>
                <th className="py-3 px-4">อีเมลที่พยายามเข้าระบบ</th>
                <th className="py-3 px-4">ผู้ใช้งานในระบบ</th>
                <th className="py-3 px-4">ผลการตรวจสอบ</th>
                <th className="py-3 px-4 font-mono">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/20 font-mono text-xs">
              {logs.map((log) => (
                <tr key={log.log_id} className="hover:bg-surface-variant/40 transition-colors">
                  <td className="py-3 px-4 text-onSurface-muted">{log.created_at}</td>
                  <td className="py-3 px-4 font-bold text-onSurface">{log.email_attempted}</td>
                  <td className="py-3 px-4 font-sans">
                    {log.first_name ? (
                      <div>
                        <span className="font-medium text-onSurface">{log.first_name} {log.last_name}</span>
                        <span className="text-onSurface-muted text-[11px] block">{log.department_name}</span>
                      </div>
                    ) : (
                      <span className="text-onSurface-muted">- (ไม่พบบัญชี)</span>
                    )}
                  </td>
                  <td className="py-3 px-4 font-sans">{getResultBadge(log.result)}</td>
                  <td className="py-3 px-4 text-onSurface-variant">{log.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
