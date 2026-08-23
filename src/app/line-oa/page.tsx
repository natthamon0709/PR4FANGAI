'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import FollowerKpiCard from '@/components/line/FollowerKpiCard';
import LineConnectionStatusBadge from '@/components/line/LineConnectionStatusBadge';
import WebhookUrlField from '@/components/line/WebhookUrlField';
import BroadcastHistoryList from '@/components/line/BroadcastHistoryList';
import { SessionUser } from '@/types';
import { LineOverviewStats, LineBroadcast } from '@/types/line';
import { Smartphone, LayoutGrid, Send, Settings, Users, Loader2, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';

export default function LineOaOverviewPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [stats, setStats] = useState<LineOverviewStats | null>(null);
  const [channelConfig, setChannelConfig] = useState<any>(null);
  const [activeRichMenu, setActiveRichMenu] = useState<any>(null);
  const [recentBroadcasts, setRecentBroadcasts] = useState<LineBroadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const loadData = async () => {
    try {
      const userRes = await fetch('/api/auth/me', { cache: 'no-store' });
      if (!userRes.ok) {
        router.push('/login');
        return;
      }
      const userData = await userRes.json();
      setCurrentUser(userData.user);

      const overviewRes = await fetch('/api/line-oa/overview', { cache: 'no-store' });
      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setStats(data.stats);
        setChannelConfig(data.channelConfig);
        setActiveRichMenu(data.activeRichMenu);
        setRecentBroadcasts(data.recentBroadcasts || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [router]);

  const handleSyncWithSheet = async () => {
    setSyncing(true);
    try {
      await fetch('/api/sheets-cms/sync-all', { method: 'POST' });
      await loadData();
    } catch (e) {
      console.error(e);
    } finally {
      setSyncing(false);
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const isAdmin = currentUser.role === 'administrator';
  const isConnected = Boolean(stats?.channelConnected || channelConfig?.webhook_verified);

  return (
    <DashboardLayout
      user={currentUser}
      breadcrumbs={[
        { label: 'LINE OA', href: '/line-oa' },
        { label: 'ภาพรวมระบบ' },
      ]}
    >
      <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline/20">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-heading font-extrabold text-onSurface flex items-center gap-2.5">
                <Smartphone className="w-6 h-6 text-[#00B900]" />
                <span>LINE Official Account</span>
              </h1>
              <LineConnectionStatusBadge
                connected={isConnected}
                channelId={channelConfig?.channel_id}
                botName={channelConfig?.bot_display_name}
                basicId={channelConfig?.bot_basic_id}
              />
            </div>
            <p className="text-xs text-onSurface-muted mt-0.5">
              หน้าด่านการให้บริการตอบคำถามผ่าน AI RAG และส่งแจ้งเตือนงานประชาสัมพันธ์แก่นักเรียน นักศึกษา และบุคลากร
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSyncWithSheet}
              disabled={syncing}
              className="h-10 px-3.5 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              {syncing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>ซิงค์กับ Google Sheet</span>
            </button>

            <Link
              href="/line-oa/broadcast"
              className="h-10 px-4 rounded-xl bg-primary text-white font-semibold text-xs flex items-center gap-1.5 hover:bg-primary-light transition-all shadow-level1"
            >
              <Send className="w-4 h-4" />
              <span>ส่งข้อความประชาสัมพันธ์</span>
            </Link>

            {isAdmin && (
              <Link
                href="/line-oa/settings"
                className="h-10 px-3.5 rounded-xl border border-outline bg-surface-card hover:bg-surface-variant text-xs font-semibold text-onSurface flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Settings className="w-4 h-4 text-primary" />
                <span>ตั้งค่า Channel</span>
              </Link>
            )}
          </div>
        </div>

        {/* 1. Follower & Message KPIs (C72) */}
        {stats && <FollowerKpiCard stats={stats} />}

        {/* 2. Webhook URL Display (C82) - Admin only */}
        {isAdmin && (
          <WebhookUrlField
            url={channelConfig?.webhook_url || 'http://localhost:3000/api/line-oa/webhook'}
            verified={Boolean(stats?.channelConnected)}
          />
        )}

        {/* 3. Main Action Hub Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: Rich Menu Hub */}
          <div className="p-5 md:p-6 rounded-3xl bg-surface-card border border-outline/30 shadow-level1 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm text-onSurface flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4 text-secondary" />
                  <span>Rich Menu ปัจจุบัน</span>
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32]">
                  ใช้งานอยู่
                </span>
              </div>

              {activeRichMenu ? (
                <div className="flex items-center gap-4 p-3 rounded-2xl bg-surface border border-outline/20">
                  <img
                    src={activeRichMenu.image_url}
                    alt={activeRichMenu.name}
                    className="w-20 h-14 object-cover rounded-xl border border-outline/30 shadow-sm"
                  />
                  <div className="space-y-0.5 min-w-0">
                    <h4 className="text-xs font-bold text-onSurface truncate">{activeRichMenu.name}</h4>
                    <p className="text-[11px] text-onSurface-muted">แถบเปิดเมนู: "{activeRichMenu.chat_bar_text}"</p>
                    <p className="text-[10px] text-primary font-semibold">6 พื้นที่กดแตะ (Tap Areas)</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-onSurface-muted">ยังไม่ได้ตั้งค่า Rich Menu หลัก</p>
              )}
            </div>

            {isAdmin && (
              <div className="pt-2">
                <Link
                  href="/line-oa/rich-menu"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  <span>จัดการและออกแบบ Rich Menu เพิ่มเติม</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>

          {/* Card: Followers Hub */}
          <div className="p-5 md:p-6 rounded-3xl bg-surface-card border border-outline/30 shadow-level1 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-heading font-bold text-sm text-onSurface flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#00B900]" />
                  <span>ผู้ติดตามและเจ้าหน้าที่</span>
                </h3>
                <span className="text-xs text-onSurface-muted font-mono">
                  รวม {stats?.totalFollowers.toLocaleString()} คน
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-surface border border-outline/20 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-onSurface-muted">เจ้าหน้าที่ที่ผูกบัญชีเพื่อรับแจ้งเตือน:</span>
                  <strong className="text-primary font-mono">{stats?.linkedStaffCount} คน</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-onSurface-muted">ผู้ติดตามทั่วไป (นักเรียน/ผู้ปกครอง):</span>
                  <strong className="text-onSurface font-mono">
                    {((stats?.totalFollowers || 3842) - (stats?.linkedStaffCount || 3)).toLocaleString()} คน
                  </strong>
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="pt-2">
                <Link
                  href="/line-oa/followers"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  <span>ดูรายชื่อผู้ติดตามทั้งหมด</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* 4. Recent Broadcasts History (C73) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-sm text-onSurface flex items-center gap-2">
              <Send className="w-4 h-4 text-primary" />
              <span>ประวัติการส่งข้อความประชาสัมพันธ์ล่าสุด (Broadcast History)</span>
            </h3>
            <Link
              href="/line-oa/broadcast"
              className="text-xs font-bold text-primary hover:underline"
            >
              ดูทั้งหมด / ส่งข้อความใหม่
            </Link>
          </div>

          <BroadcastHistoryList broadcasts={recentBroadcasts} />
        </div>
      </div>
    </DashboardLayout>
  );
}
