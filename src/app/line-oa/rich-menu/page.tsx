'use client';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { safeFetchJson } from '@/lib/api-client';
import RichMenuMobilePreview from '@/components/line/RichMenuMobilePreview';
import TapAreaActionForm from '@/components/line/TapAreaActionForm';
import SessionAlert from '@/components/SessionAlert';
import { SessionUser } from '@/types';
import { LineRichMenu, LineTapArea } from '@/types/line';
import { LayoutGrid, Plus, Check, Save, Sparkles, Loader2, ArrowLeft, Trash2, Eye, Upload, Image as ImageIcon, ExternalLink, AlertTriangle } from 'lucide-react';

const DEFAULT_SAMPLE_TAP_AREAS: LineTapArea[] = [
  { id: 'area-1', label: 'ถามคำถาม AI', bounds: { x: 0, y: 0, width: 833, height: 843 }, action: { type: 'message', text: 'สอบถามข้อมูลวิทยาลัย' } },
  { id: 'area-2', label: 'ค้นหาแบบฟอร์ม', bounds: { x: 833, y: 0, width: 833, height: 843 }, action: { type: 'message', text: 'ขอแบบฟอร์มและคำร้อง' } },
  { id: 'area-3', label: 'ติดต่อเจ้าหน้าที่', bounds: { x: 1666, y: 0, width: 834, height: 843 }, action: { type: 'message', text: 'เบอร์โทรติดต่อฝ่ายงาน' } },
  { id: 'area-4', label: 'ข่าวและประกาศ', bounds: { x: 0, y: 843, width: 833, height: 843 }, action: { type: 'message', text: 'ประกาศล่าสุดของวิทยาลัย' } },
  { id: 'area-5', label: 'ปฏิทินการศึกษา', bounds: { x: 833, y: 843, width: 833, height: 843 }, action: { type: 'uri', uri: 'https://fang.ac.th/calendar' } },
  { id: 'area-6', label: 'เว็บไซต์วิทยาลัย', bounds: { x: 1666, y: 843, width: 834, height: 843 }, action: { type: 'uri', uri: 'https://fang.ac.th' } },
];

export default function RichMenuManagerPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [richMenus, setRichMenus] = useState<LineRichMenu[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<LineRichMenu | null>(null);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>('area-1');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states for editor
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [chatBarText, setChatBarText] = useState('เมนูหลัก');
  const [tapAreas, setTapAreas] = useState<LineTapArea[]>(DEFAULT_SAMPLE_TAP_AREAS);

  useEffect(() => {
    async function loadData() {
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

        const menuRes = await safeFetchJson('/api/line-oa/rich-menu');
        if (menuRes.ok && menuRes.data) {
          const data = menuRes.data;
          setRichMenus(data.richMenus || []);
          if (data.richMenus?.length > 0) {
            const active = data.richMenus.find((m: LineRichMenu) => m.is_default) || data.richMenus[0];
            setSelectedMenu(active);
            setName(active.name);
            setImageUrl(active.image_url);
            setChatBarText(active.chat_bar_text);
            setTapAreas(active.tap_areas || DEFAULT_SAMPLE_TAP_AREAS);
          }
        }
      } catch (err: any) {
        setAlertMsg({ type: 'error', text: err.message });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleSelectMenu = (menu: LineRichMenu) => {
    setSelectedMenu(menu);
    setName(menu.name);
    setImageUrl(menu.image_url);
    setChatBarText(menu.chat_bar_text);
    setTapAreas(menu.tap_areas || DEFAULT_SAMPLE_TAP_AREAS);
    setSelectedAreaId(menu.tap_areas?.[0]?.id || 'area-1');
  };

  const handleUpdateTapArea = (updated: LineTapArea) => {
    setTapAreas(prev => prev.map(a => a.id === updated.id ? updated : a));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setAlertMsg(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/line-oa/rich-menu/upload-image', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();
      if (res.ok && data.imageUrl) {
        setImageUrl(data.imageUrl);
        setAlertMsg({ type: 'success', text: `✅ อัปโหลดรูปภาพเข้าสู่ระบบสำเร็จ (${data.fileName}) พร้อมแสดงตัวอย่างแล้ว` });
      } else {
        setAlertMsg({ type: 'error', text: `❌ ${data.error || 'อัปโหลดรูปภาพไม่สำเร็จ'}` });
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: `❌ เกิดข้อผิดพลาด: ${err.message}` });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSetDefault = async () => {
    if (!selectedMenu) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/line-oa/rich-menu/${selectedMenu.menu_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true, publish_now: true })
      });
      const data = await res.json();
      if (res.ok) {
        setAlertMsg({ type: 'success', text: `✅ ${data.message || 'เผยแพร่เป็น Rich Menu หลักสำหรับผู้ติดตามทุกคนเรียบร้อยแล้ว'}` });
        const menuRes = await fetch('/api/line-oa/rich-menu');
        const menuData = await menuRes.json();
        setRichMenus(menuData.richMenus || []);
        if (menuData.richMenus) {
          const updated = menuData.richMenus.find((m: any) => m.menu_id === selectedMenu.menu_id);
          if (updated) setSelectedMenu(updated);
        }
      } else {
        setAlertMsg({ type: 'error', text: data.error });
      }
    } catch (e: any) {
      setAlertMsg({ type: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setAlertMsg(null);

    try {
      if (selectedMenu) {
        // Update existing
        const res = await fetch(`/api/line-oa/rich-menu/${selectedMenu.menu_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            image_url: imageUrl,
            chat_bar_text: chatBarText,
            tap_areas: tapAreas,
            publish_now: true,
            is_default: true
          })
        });
        const data = await res.json();
        if (res.ok) {
          setAlertMsg({ type: 'success', text: `✅ ${data.message || 'บันทึกและเผยแพร่ Rich Menu บน LINE Chat สำเร็จ'}` });
        } else {
          setAlertMsg({ type: 'error', text: data.error });
        }
      } else {
        // Create new
        const res = await fetch('/api/line-oa/rich-menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            image_url: imageUrl,
            chat_bar_text: chatBarText,
            tap_areas: tapAreas,
            is_default: true
          })
        });
        const data = await res.json();
        if (res.ok) {
          setAlertMsg({ type: 'success', text: `✅ ${data.message || 'สร้างและเผยแพร่ Rich Menu ใหม่สำเร็จ'}` });
        } else {
          setAlertMsg({ type: 'error', text: data.error });
        }
      }

      // Reload
      const menuRes = await fetch('/api/line-oa/rich-menu');
      const menuData = await menuRes.json();
      setRichMenus(menuData.richMenus || []);
      if (menuData.richMenus?.length > 0) {
        const active = menuData.richMenus.find((m: LineRichMenu) => m.is_default) || menuData.richMenus[0];
        setSelectedMenu(active);
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const isPicInThViewer = imageUrl.includes('pic.in.th/image/');

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout
      user={currentUser}
      breadcrumbs={[
        { label: 'LINE OA', href: '/line-oa' },
        { label: 'จัดการ Rich Menu' },
      ]}
    >
      <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline/20">
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-extrabold text-onSurface flex items-center gap-2.5">
              <LayoutGrid className="w-6 h-6 text-[#8B6F2E]" />
              <span>จัดการ Rich Menu (LINE Official Account)</span>
            </h1>
            <p className="text-xs text-onSurface-muted mt-0.5">
              ออกแบบปุ่มลัด 6 ช่องบนแถบเมนูด้านล่างของแชท LINE พร้อมดูตัวอย่างแบบเรียลไทม์ (WYSIWYG)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedMenu?.line_rich_menu_id ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/30 text-xs font-bold shadow-sm">
                <Check className="w-4 h-4 text-[#00B900]" />
                <span>เผยแพร่บน LINE แล้ว</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF8E1] text-[#8B6F2E] border border-[#8B6F2E]/30 text-xs font-bold shadow-sm">
                <span>แบบร่างในระบบ</span>
              </span>
            )}

            <button
              type="button"
              onClick={handleSetDefault}
              disabled={saving || !selectedMenu}
              className="h-10 px-4 rounded-xl bg-[#00B900] text-white font-bold text-xs flex items-center gap-1.5 hover:bg-[#009900] transition-all shadow-level1 disabled:opacity-50 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>🚀 เผยแพร่ไปยัง LINE Chat เดี๋ยวนี้</span>
            </button>
          </div>
        </div>

        {alertMsg && (
          <SessionAlert
            type={alertMsg.type}
            message={alertMsg.text}
            onClose={() => setAlertMsg(null)}
          />
        )}

        {/* 2-Column Layout: Left (Live Phone Preview) & Right (Form Editor) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Real-Time Mobile Preview (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center p-4 rounded-3xl bg-surface-card border border-outline/30 shadow-level1">
            <span className="text-xs font-bold text-onSurface mb-2 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-primary" />
              <span>ตัวอย่างเสมือนบนมือถือ (Live Mobile Preview)</span>
            </span>
            <RichMenuMobilePreview
              imageUrl={imageUrl}
              chatBarText={chatBarText}
              tapAreas={tapAreas}
              selectedAreaId={selectedAreaId}
              onSelectArea={setSelectedAreaId}
            />
          </div>

          {/* Right Column: Menu Settings & Tap Area Editor (7 cols) */}
          <div className="lg:col-span-7 space-y-5">
            {/* List of Existing Rich Menus */}
            <div className="p-4 rounded-2xl bg-surface-card border border-outline/30 shadow-level1 flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-bold text-onSurface flex-shrink-0">เมนูที่มีในระบบ:</span>
              {richMenus.map((m) => (
                <button
                  key={m.menu_id}
                  type="button"
                  onClick={() => handleSelectMenu(m)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all flex-shrink-0 border ${
                    selectedMenu?.menu_id === m.menu_id
                      ? 'bg-primary text-onPrimary border-primary shadow-sm'
                      : 'bg-surface hover:bg-surface-variant text-onSurface border-outline/30'
                  }`}
                >
                  <span>{m.name}</span>
                  {m.is_default && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#E8F5E9] text-[#2E7D32]">
                      หลัก
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Menu Form */}
            <form onSubmit={handleSaveMenu} className="p-6 rounded-3xl bg-surface-card border border-outline/30 shadow-level1 space-y-4">
              <h3 className="font-heading font-bold text-sm text-onSurface pb-2 border-b border-outline/15 flex items-center justify-between">
                <span>ข้อมูล Rich Menu และรูปภาพ</span>
                <span className="text-[11px] font-normal text-onSurface-muted">ขนาดแนะนำ 2500×1686 พิกเซล</span>
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-onSurface mb-1">
                    ชื่อ Rich Menu <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={saving}
                    className="w-full h-10 px-3 rounded-xl border border-outline bg-surface text-xs text-onSurface outline-none focus:border-primary"
                  />
                </div>

                {/* Image Upload Box & URL Input */}
                <div className="p-4 rounded-2xl bg-surface-variant/40 border border-outline/30 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-bold text-onSurface flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-primary" />
                      <span>รูปภาพพื้นหลังเมนู (Menu Background Image)</span>
                    </label>

                    {/* Local File Upload Button */}
                    <div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage || saving}
                        className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold flex items-center gap-1.5 hover:bg-primary-hover shadow-sm transition-all cursor-pointer disabled:opacity-50"
                      >
                        {uploadingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        <span>📁 อัปโหลดรูปภาพจากเครื่อง</span>
                      </button>
                    </div>
                  </div>

                  {/* URL Input */}
                  <div>
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value.trim())}
                      placeholder="หรือวาง URL รูปภาพ (เช่น /uploads/richmenu/... หรือ Direct Image URL)"
                      required
                      disabled={saving}
                      className="w-full h-10 px-3 rounded-xl border border-outline bg-surface text-xs font-mono text-onSurface outline-none focus:border-primary"
                    />
                  </div>

                  {/* Warning if user pasted pic.in.th viewer link */}
                  {isPicInThViewer && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>ลิงก์ที่วางเป็นลิงก์หน้าเว็บดูรูป (Viewer Link) ของ pic.in.th</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-amber-800">
                        เว็บ pic.in.th มีระบบ Cloudflare ป้องกันไม่ให้แอปดึงภาพข้ามเว็บได้ แนะนำให้:
                      </p>
                      <ul className="list-disc list-inside text-[11px] space-y-1 text-amber-800">
                        <li><strong>วิธีที่ง่ายและดีที่สุด:</strong> บันทึกรูปภาพลงคอมฯ แล้วกดปุ่ม <strong>"📁 อัปโหลดรูปภาพจากเครื่อง"</strong> ด้านบน</li>
                        <li>หรือคัดลอกลิงก์ตรงจากช่อง <strong>Direct</strong> ใน pic.in.th (ขึ้นต้นด้วย https://img1.pic.in.th/...)</li>
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-onSurface mb-1">
                    ข้อความบนแถบเปิดเมนูด้านล่าง (Chat Bar Text)
                  </label>
                  <input
                    type="text"
                    maxLength={14}
                    value={chatBarText}
                    onChange={(e) => setChatBarText(e.target.value)}
                    disabled={saving}
                    className="w-full h-10 px-3 rounded-xl border border-outline bg-surface text-xs text-onSurface outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Tap Area Action Form */}
              <div className="pt-3 border-t border-outline/15">
                <TapAreaActionForm
                  tapAreas={tapAreas}
                  selectedAreaId={selectedAreaId}
                  onSelectArea={setSelectedAreaId}
                  onUpdateArea={handleUpdateTapArea}
                  disabled={saving}
                />
              </div>

              {/* Save Button */}
              <div className="pt-3 border-t border-outline/20 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="h-11 px-6 rounded-2xl bg-primary text-onPrimary font-bold text-xs flex items-center gap-2 hover:bg-primary-hover shadow-level1 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>💾 บันทึกและเผยแพร่ Rich Menu</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
