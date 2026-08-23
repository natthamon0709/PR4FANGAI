'use client';
import React, { useState } from 'react';
import { UserPreferences, SystemEventType } from '@/types/settings';
import { UserCheck, Save, CheckCircle2, Layout, Smartphone, Mail, Loader2 } from 'lucide-react';

interface PersonalNotificationFormProps {
  initialPreferences: UserPreferences;
}

export default function PersonalNotificationForm({ initialPreferences }: PersonalNotificationFormProps) {
  const [prefs, setPrefs] = useState<UserPreferences>(initialPreferences);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  const eventTypesList: { id: SystemEventType; label: string; desc: string }[] = [
    {
      id: 'pending_review',
      label: 'องค์ความรู้รอตรวจสอบ',
      desc: 'แจ้งเตือนเมื่อมีบทความใหม่หรือแก้ไขที่รอการตรวจสอบอนุมัติ'
    },
    {
      id: 'knowledge_approved',
      label: 'องค์ความรู้ของฉันได้รับการอนุมัติ',
      desc: 'แจ้งเตือนเมื่อบทความที่คุณสร้างได้รับการเผยแพร่เรียบร้อย'
    },
    {
      id: 'knowledge_sent_back',
      label: 'องค์ความรู้ของฉันถูกส่งกลับแก้ไข',
      desc: 'แจ้งเตือนเมื่อผู้ดูแลระบบส่งข้อเสนอแนะให้ปรับปรุงบทความ'
    },
    {
      id: 'sync_error',
      label: 'Google Sheets ซิงค์ผิดพลาด',
      desc: 'แจ้งเตือนเมื่อการซิงค์ข้อมูลกับ Google Sheet มีปัญหา'
    }
  ];

  const handleToggleEvent = (id: SystemEventType) => {
    const list = prefs.event_types.includes(id)
      ? prefs.event_types.filter(e => e !== id)
      : [...prefs.event_types, id];
    setPrefs({ ...prefs, event_types: list });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMessage(false);
    try {
      const res = await fetch('/api/settings/my-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs)
      });
      if (res.ok) {
        setSavedMessage(true);
        setTimeout(() => setSavedMessage(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="p-5 md:p-8 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 space-y-6">
      <div className="flex items-center gap-3 border-b border-outline/20 pb-4">
        <div className="p-2.5 rounded-xl bg-primary-container/40 text-primary">
          <UserCheck className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base md:text-lg font-bold text-onSurface font-heading">
            การตั้งค่าการแจ้งเตือนส่วนตัว (Personal Notification Preferences)
          </h2>
          <p className="text-xs text-onSurface-muted mt-0.5">
            เลือกช่องทางและประเภทเหตุการณ์ที่คุณต้องการรับการแจ้งเตือนสำหรับบัญชีของคุณ
          </p>
        </div>
      </div>

      {savedMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>บันทึกการตั้งค่าส่วนตัวเรียบร้อยแล้ว</span>
        </div>
      )}

      {/* Channel toggles */}
      <div className="space-y-3">
        <h3 className="text-xs md:text-sm font-bold text-primary uppercase tracking-wider">
          1. ช่องทางการรับแจ้งเตือน (Notification Channels)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="p-3.5 bg-surface rounded-xl border border-outline/30 flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={prefs.in_app_notifications}
              onChange={(e) => setPrefs({ ...prefs, in_app_notifications: e.target.checked })}
              className="w-4 h-4 text-primary rounded"
            />
            <div className="flex items-center gap-2">
              <Layout className="w-4 h-4 text-primary" />
              <div>
                <p className="text-xs font-bold text-onSurface">ในระบบเว็บ (In-app)</p>
                <p className="text-[10px] text-onSurface-muted">กระดิ่งแจ้งเตือนบนแถบบน</p>
              </div>
            </div>
          </label>

          <label className="p-3.5 bg-surface rounded-xl border border-outline/30 flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={prefs.line_notifications}
              onChange={(e) => setPrefs({ ...prefs, line_notifications: e.target.checked })}
              className="w-4 h-4 text-primary rounded"
            />
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <div>
                <p className="text-xs font-bold text-onSurface">ผ่าน LINE (Push)</p>
                <p className="text-[10px] text-onSurface-muted">ส่งเข้าบัญชี LINE ที่ผูกไว้</p>
              </div>
            </div>
          </label>

          <label className="p-3.5 bg-surface rounded-xl border border-outline/30 flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={prefs.email_notifications}
              onChange={(e) => setPrefs({ ...prefs, email_notifications: e.target.checked })}
              className="w-4 h-4 text-primary rounded"
            />
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              <div>
                <p className="text-xs font-bold text-onSurface">ทางอีเมล (Email)</p>
                <p className="text-[10px] text-onSurface-muted">ส่งเข้าอีเมลบัญชีผู้ใช้</p>
              </div>
            </div>
          </label>
        </div>
      </div>

      {/* Event Subscriptions */}
      <div className="space-y-3 pt-4 border-t border-outline/15">
        <h3 className="text-xs md:text-sm font-bold text-primary uppercase tracking-wider">
          2. ประเภทเหตุการณ์ที่ต้องการรับการแจ้งเตือน (Event Subscriptions)
        </h3>

        <div className="space-y-2">
          {eventTypesList.map((item) => {
            const isChecked = prefs.event_types.includes(item.id);
            return (
              <label
                key={item.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all select-none ${
                  isChecked ? 'bg-primary-container/20 border-primary' : 'bg-surface border-outline/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleToggleEvent(item.id)}
                    className="w-4 h-4 text-primary rounded"
                  />
                  <div>
                    <p className="text-xs font-bold text-onSurface">{item.label}</p>
                    <p className="text-[11px] text-onSurface-muted">{item.desc}</p>
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div className="pt-4 border-t border-outline/15 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs md:text-sm font-bold hover:bg-primary-dark shadow-sm flex items-center gap-2 disabled:opacity-50 transition-all"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าส่วนตัว'}</span>
        </button>
      </div>
    </form>
  );
}
