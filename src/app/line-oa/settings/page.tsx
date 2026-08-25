'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { safeFetchJson } from '@/lib/api-client';
import LineConnectionStatusBadge from '@/components/line/LineConnectionStatusBadge';
import WebhookUrlField from '@/components/line/WebhookUrlField';
import SessionAlert from '@/components/SessionAlert';
import { SessionUser } from '@/types';
import { LineChannelConfig } from '@/types/line';
import { Settings, Save, Key, Trash2, RefreshCw, Loader2, ArrowLeft, Radio, CheckCircle2, ShieldCheck, Lock, AlertCircle, FileSpreadsheet, ExternalLink } from 'lucide-react';

export default function LineChannelSettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [channelConfig, setChannelConfig] = useState<LineChannelConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [channelId, setChannelId] = useState('');
  const [channelSecret, setChannelSecret] = useState('');
  const [channelToken, setChannelToken] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('http://localhost:3000/api/line-oa/webhook');
  const [appsScriptUrl, setAppsScriptUrl] = useState('');

  const loadSettings = async () => {
    try {
      const userRes = await safeFetchJson('/api/auth/me');
      if (!userRes.ok || !userRes.data?.user) {
        router.push('/login');
        return;
      }
      const user = userRes.data.user;
      setCurrentUser(user);

      if (user.role !== 'administrator') {
        router.push('/line-oa');
        return;
      }

      const settingsRes = await safeFetchJson('/api/line-oa/settings');
      if (settingsRes.ok && settingsRes.data) {
        const data = settingsRes.data;
        if (data.config) {
          setChannelConfig(data.config);
          setChannelId(data.config.channel_id || '');
          setWebhookUrl(data.config.webhook_url || 'http://localhost:3000/api/line-oa/webhook');
          setChannelSecret(data.config.channel_secret_masked || '');
          setChannelToken(data.config.channel_access_token_masked || '');
        }
        if (data.google_apps_script_url) {
          setAppsScriptUrl(data.google_apps_script_url);
        }
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [router]);

  const handleTestConnection = async () => {
    setTesting(true);
    setAlertMsg(null);

    try {
      const res = await safeFetchJson('/api/line-oa/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_access_token: channelToken || undefined
        })
      });

      if (res.ok && res.data?.success) {
        setAlertMsg({
          type: 'success',
          text: `✅ ${res.data.message} — บอท: ${res.data.botInfo?.displayName} (@${res.data.botInfo?.basicId})`
        });
        await loadSettings();
      } else {
        setAlertMsg({
          type: 'error',
          text: `❌ ไม่สามารถเชื่อมต่อกับ LINE API ได้: ${res.data?.error || res.error || 'กรุณาตรวจสอบ Channel Access Token'}`
        });
        await loadSettings();
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `เกิดข้อผิดพลาด: ${err.message}` });
    } finally {
      setTesting(false);
    }
  };

  const handlePullFromGoogleSheets = async () => {
    setPulling(true);
    setAlertMsg(null);

    try {
      const res = await safeFetchJson('/api/line-oa/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pull_from_sheet' })
      });

      if (res.ok && res.data?.success) {
        setAlertMsg({ type: 'success', text: `✅ ${res.data.message}` });
        await loadSettings();
      } else {
        setAlertMsg({ type: 'error', text: res.data?.error || res.error || 'ไม่สามารถดึงข้อมูลจาก Google Sheet ได้' });
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `เกิดข้อผิดพลาด: ${err.message}` });
    } finally {
      setPulling(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setAlertMsg(null);

    try {
      const res = await safeFetchJson('/api/line-oa/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel_id: channelId,
          channel_secret: channelSecret || undefined,
          channel_access_token: channelToken || undefined,
          webhook_url: webhookUrl,
          google_apps_script_url: appsScriptUrl
        })
      });

      if (res.ok && res.data) {
        if (res.data.warning) {
          setAlertMsg({ type: 'error', text: res.data.message });
        } else {
          setAlertMsg({ type: 'success', text: res.data.message });
        }
        await loadSettings();
      } else {
        setAlertMsg({ type: 'error', text: res.data?.error || res.error || 'ไม่สามารถบันทึกการตั้งค่าได้' });
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleClearSettings = async () => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างการตั้งค่า LINE Channel ทั้งหมด? สถานะจะเปลี่ยนเป็นยังไม่ได้เชื่อมต่อ')) {
      return;
    }
    setClearing(true);
    setAlertMsg(null);

    try {
      const res = await safeFetchJson('/api/line-oa/settings', {
        method: 'DELETE'
      });

      if (res.ok && res.data) {
        setAlertMsg({ type: 'success', text: res.data.message || 'ล้างการตั้งค่าเรียบร้อยแล้ว' });
        setChannelId('');
        setChannelSecret('');
        setChannelToken('');
        setWebhookUrl('http://localhost:3000/api/line-oa/webhook');
        await loadSettings();
      } else {
        setAlertMsg({ type: 'error', text: res.data?.error || res.error || 'ไม่สามารถล้างการตั้งค่าได้' });
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message });
    } finally {
      setClearing(false);
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const isConnected = Boolean(channelConfig?.webhook_verified);

  return (
    <DashboardLayout
      user={currentUser}
      breadcrumbs={[
        { label: 'LINE OA', href: '/line-oa' },
        { label: 'ตั้งค่าการเชื่อมต่อ Channel' },
      ]}
    >
      <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline/20">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl md:text-2xl font-heading font-extrabold text-onSurface flex items-center gap-2.5">
                <Settings className="w-6 h-6 text-[#00B900]" />
                <span>ตั้งค่า LINE Channel (Messaging API)</span>
              </h1>
              <LineConnectionStatusBadge
                connected={isConnected}
                channelId={channelConfig?.channel_id}
                botName={channelConfig?.bot_display_name}
                basicId={channelConfig?.bot_basic_id}
              />
            </div>
            <p className="text-xs text-onSurface-muted mt-0.5">
              เชื่อมต่อระบบกับ LINE Developers Console เพื่อเปิดใช้งาน Webhook และ AI ตอบคำถามอัตโนมัติ (ตรวจสอบสถานะจริงผ่าน LINE API)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePullFromGoogleSheets}
              disabled={pulling || saving || testing}
              className="h-10 px-3.5 rounded-xl border border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              {pulling ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
              <span>ดึงค่าจาก Google Sheet</span>
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

        {/* Live Bot Information Card (If connected) */}
        {isConnected && channelConfig?.bot_display_name && (
          <div className="p-5 rounded-3xl bg-[#00B900]/5 border-2 border-[#00B900]/30 shadow-level1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <img
                src={channelConfig.bot_picture_url || 'https://api.dicebear.com/7.x/bottts/svg?seed=linebot'}
                alt={channelConfig.bot_display_name}
                className="w-14 h-14 rounded-2xl border-2 border-[#00B900] object-cover bg-white shadow-sm"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-heading font-bold text-base text-onSurface">
                    {channelConfig.bot_display_name}
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/20">
                    Official Bot Active
                  </span>
                </div>
                <p className="text-xs text-onSurface-muted font-mono mt-0.5">
                  Basic ID: <strong className="text-[#00B900]">@{channelConfig.bot_basic_id?.replace('@', '')}</strong>
                  {channelConfig.channel_id && <span className="ml-2 text-onSurface-muted">| Channel ID: {channelConfig.channel_id}</span>}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs text-[#2E7D32] font-semibold bg-white px-3.5 py-2 rounded-xl border border-[#00B900]/30 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-[#00B900]" />
                <span>สถานะเชื่อมต่อสดกับ LINE สำเร็จ</span>
              </span>
            </div>
          </div>
        )}

        {/* Webhook URL Helper Card (C82) - Fully Editable & Live Sync */}
        <WebhookUrlField
          url={webhookUrl}
          onChange={setWebhookUrl}
          verified={isConnected}
          disabled={saving || clearing}
        />

        {/* Settings Form */}
        <form onSubmit={handleSave} className="p-6 md:p-8 rounded-3xl bg-surface-card border border-outline/30 shadow-level1 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-outline/15">
            <h3 className="font-heading font-bold text-sm text-onSurface flex items-center gap-2">
              <Key className="w-4 h-4 text-primary" />
              <span>ข้อมูลการรับรองความถูกต้อง (LINE Channel Credentials)</span>
            </h3>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || saving || clearing}
                className="px-3.5 py-2 rounded-xl border border-[#00B900] bg-[#00B900]/10 hover:bg-[#00B900]/20 text-[#00B900] text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 shadow-sm cursor-pointer"
              >
                {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5" />}
                <span>ทดสอบเชื่อมต่อสด (Test Live API)</span>
              </button>

              <button
                type="button"
                onClick={handleClearSettings}
                disabled={clearing || saving || testing}
                className="px-3 py-2 rounded-xl border border-error/30 bg-error/5 hover:bg-error/10 text-error text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                {clearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>ล้างค่า / ยกเลิกเชื่อมต่อ</span>
              </button>
            </div>
          </div>

          <div className="space-y-5">
            {/* Channel ID */}
            <div>
              <label className="block text-xs font-semibold text-onSurface mb-1">
                Channel ID
              </label>
              <input
                type="text"
                value={channelId}
                onChange={(e) => setChannelId(e.target.value)}
                disabled={saving || clearing}
                placeholder="เช่น 2006206866"
                className="w-full h-11 px-4 rounded-xl border border-outline bg-surface text-sm font-mono text-onSurface outline-none focus:border-primary"
              />
            </div>

            {/* Channel Secret */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-onSurface">
                  Channel Secret (ใช้ตรวจสอบ X-Line-Signature)
                </label>
                {channelConfig?.channel_secret_masked && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#2E7D32] font-mono">
                    <Lock className="w-3 h-3" />
                    <span>บันทึกในฐานข้อมูลแล้ว ({channelConfig.channel_secret_masked})</span>
                  </span>
                )}
              </div>
              <input
                type="password"
                value={channelSecret}
                onChange={(e) => setChannelSecret(e.target.value)}
                placeholder="กรอก Channel Secret ใหม่ หรือลบออกเพื่อยกเลิก"
                disabled={saving || clearing}
                className="w-full h-11 px-4 rounded-xl border border-outline bg-surface text-sm font-mono text-onSurface outline-none focus:border-primary"
              />
              <p className="text-[11px] text-onSurface-muted mt-1">
                เข้ารหัส AES-256 ปลอดภัยในฐานข้อมูล
              </p>
            </div>

            {/* Channel Access Token (Long-lived) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-onSurface">
                  Channel Access Token (Long-Lived)
                </label>
                {channelConfig?.channel_access_token_masked && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#2E7D32] font-mono">
                    <Lock className="w-3 h-3" />
                    <span>บันทึกในฐานข้อมูลแล้ว ({channelConfig.channel_access_token_masked})</span>
                  </span>
                )}
              </div>
              <textarea
                rows={3}
                value={channelToken}
                onChange={(e) => setChannelToken(e.target.value)}
                placeholder="กรอก Channel Access Token ใหม่ หรือลบออกเพื่อยกเลิกการเชื่อมต่อ"
                disabled={saving || clearing}
                className="w-full p-3 rounded-xl border border-outline bg-surface text-xs font-mono text-onSurface outline-none focus:border-primary resize-y"
              />
              <p className="text-[11px] text-onSurface-muted mt-1">
                Token สำหรับส่งข้อความ Push / Reply / Multicast และใช้ทดสอบความถูกต้องกับ LINE Messaging API
              </p>
            </div>

            {/* Google Apps Script Web App URL for Real-time 2-Way Sync */}
            <div className="p-4 rounded-2xl bg-surface-variant/30 border border-outline/30 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-onSurface flex items-center gap-1.5">
                  <FileSpreadsheet className="w-4 h-4 text-primary" />
                  <span>Google Apps Script Web App URL (สำหรับ Push ข้อมูลเข้า Google Sheet อัตโนมัติ)</span>
                </label>
                <a
                  href={`https://docs.google.com/spreadsheets/d/1-zp32f6bkCcXpGo5O__moHCAXcm_Sjg0rTPRkTK6fYs/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-primary flex items-center gap-1 hover:underline"
                >
                  <span>เปิด Google Sheet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <input
                type="text"
                value={appsScriptUrl}
                onChange={(e) => setAppsScriptUrl(e.target.value)}
                disabled={saving || clearing}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec (ได้จากการกด Deploy > New Deployment > Web app)"
                className="w-full h-10 px-3.5 rounded-xl border border-outline bg-surface text-xs font-mono text-onSurface outline-none focus:border-primary"
              />
              <p className="text-[11px] text-onSurface-muted">
                เมื่อกรอก URL นี้ ทุกครั้งที่มีการบันทึกการตั้งค่าหรือตัดการเชื่อมต่อ ระบบจะส่งข้อมูลไปอัปเดตแท็บ <strong>LINE_Configs</strong> ใน Google Sheet ทันที
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-outline/20 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[11px] text-onSurface-muted">
              เมื่อกดบันทึก ระบบจะบันทึกลงฐานข้อมูลและทดสอบกับ LINE Messaging API โดยอัตโนมัติ
            </p>

            <button
              type="submit"
              disabled={saving || testing || clearing}
              className="w-full sm:w-auto h-11 px-6 rounded-2xl bg-primary text-onPrimary font-semibold text-xs md:text-sm flex items-center justify-center gap-2 hover:bg-primary-hover shadow-level1 transition-all disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>บันทึกการตั้งค่าและตรวจสอบ Channel</span>
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
