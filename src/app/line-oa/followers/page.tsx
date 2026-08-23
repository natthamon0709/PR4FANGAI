'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import FollowerTable from '@/components/line/FollowerTable';
import SessionAlert from '@/components/SessionAlert';
import { SessionUser } from '@/types';
import { LineFollower } from '@/types/line';
import { Users, ArrowLeft, RefreshCw, Loader2, UserCheck, Smartphone, CheckCircle2, QrCode, FileSpreadsheet, ShieldAlert } from 'lucide-react';

export default function FollowersPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [followers, setFollowers] = useState<LineFollower[]>([]);
  const [botInfo, setBotInfo] = useState<{ bot_display_name?: string; bot_basic_id?: string; connected?: boolean } | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [syncingLine, setSyncingLine] = useState(false);
  const [syncingSheet, setSyncingSheet] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadFollowers = async () => {
    try {
      const userRes = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!userRes.ok) {
        router.push('/login');
        return;
      }
      const userData = await userRes.json();
      setCurrentUser(userData.user);

      if (userData.user.role !== 'administrator') {
        router.push('/line-oa');
        return;
      }

      const params = new URLSearchParams({ search, status: statusFilter });
      const res = await fetch(`/api/line-oa/followers?${params.toString()}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setFollowers(data.followers || []);
        setBotInfo(data.botInfo || null);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFollowers();
  }, [search, statusFilter, router]);

  const handleSyncFromLineApi = async () => {
    setSyncingLine(true);
    setAlertMsg(null);

    try {
      const res = await fetch('/api/line-oa/followers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync_line_api' })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAlertMsg({
          type: 'success',
          text: `✅ ${data.message}`
        });
        await loadFollowers();
      } else {
        setAlertMsg({
          type: 'error',
          text: `❌ ${data.error || 'ไม่สามารถดึงข้อมูลจาก LINE API ได้'}`
        });
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `เกิดข้อผิดพลาด: ${err.message}` });
    } finally {
      setSyncingLine(false);
    }
  };

  const handleSyncFromSheet = async () => {
    setSyncingSheet(true);
    setAlertMsg(null);

    try {
      const res = await fetch('/api/sheets-cms/sync-all', { method: 'POST' });
      if (res.ok) {
        setAlertMsg({ type: 'success', text: '✅ ซิงค์ข้อมูลผู้ติดตามกับ Google Sheet เรียบร้อยแล้ว' });
        await loadFollowers();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message });
    } finally {
      setSyncingSheet(false);
    }
  };

  if (loading && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const linkedCount = followers.filter(f => f.linked_master_user_id).length;
  const guestCount = followers.filter(f => !f.linked_master_user_id && !f.blocked).length;

  return (
    <DashboardLayout
      user={currentUser!}
      breadcrumbs={[
        { label: 'LINE OA', href: '/line-oa' },
        { label: 'รายชื่อผู้ติดตาม' },
      ]}
    >
      <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline/20">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-heading font-extrabold text-onSurface flex items-center gap-2.5">
                <Users className="w-6 h-6 text-[#00B900]" />
                <span>รายชื่อผู้ติดตาม LINE Official Account</span>
              </h1>
              {botInfo?.connected ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/30 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#00B900]" />
                  <span>{botInfo.bot_display_name || 'Official Account'} (@{botInfo.bot_basic_id?.replace('@', '')})</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-error/10 text-error border border-error/20">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>ยังไม่ได้เชื่อมต่อ LINE OA</span>
                </span>
              )}
            </div>
            <p className="text-xs text-onSurface-muted mt-0.5">
              รายชื่อจริงของผู้ใช้งานที่ติดตาม LINE Official Account และสถานะการผูกบัญชีบุคลากร
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSyncFromLineApi}
              disabled={syncingLine || syncingSheet}
              className="h-10 px-3.5 rounded-xl bg-[#00B900] text-white hover:bg-[#009900] text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {syncingLine ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
              <span>ดึงผู้ติดตามสดจาก LINE API</span>
            </button>

            <button
              type="button"
              onClick={handleSyncFromSheet}
              disabled={syncingSheet || syncingLine}
              className="h-10 px-3.5 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              {syncingSheet ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              <span>ซิงค์กับ Google Sheet</span>
            </button>

            <Link
              href="/line-oa"
              className="h-10 px-3.5 rounded-xl border border-outline bg-surface-card hover:bg-surface-variant text-xs font-semibold text-onSurface flex items-center gap-1.5 shadow-sm transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>กลับหน้าภาพรวม</span>
            </Link>
          </div>
        </div>

        {alertMsg && (
          <SessionAlert
            type={alertMsg.type}
            message={alertMsg.text}
            onClose={() => setAlertMsg(null)}
          />
        )}

        {/* Stats Mini Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-surface-card border border-outline/30 shadow-level1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#00B900]/10 flex items-center justify-center text-[#00B900]">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-onSurface-muted block">ผู้ติดตามจริงทั้งหมด</span>
              <strong className="text-lg font-heading font-extrabold text-onSurface">{followers.length} คน</strong>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface-card border border-outline/30 shadow-level1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-onSurface-muted block">ผูกบัญชีบุคลากรวิทยาลัยแล้ว</span>
              <strong className="text-lg font-heading font-extrabold text-primary">{linkedCount} คน</strong>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-surface-card border border-outline/30 shadow-level1 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-surface-variant flex items-center justify-center text-onSurface-muted">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] text-onSurface-muted block">บุคคลทั่วไป / นักศึกษา (Guest)</span>
              <strong className="text-lg font-heading font-extrabold text-onSurface">{guestCount} คน</strong>
            </div>
          </div>
        </div>

        {/* Follower Table */}
        <FollowerTable
          followers={followers}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
        />
      </div>
    </DashboardLayout>
  );
}
