'use client';
import React, { useState } from 'react';
import { CollegeProfile } from '@/types/settings';
import { Building2, Save, Globe, Phone, Mail, MapPin, CheckCircle2, Loader2 } from 'lucide-react';

interface CollegeProfileFormProps {
  initialData: CollegeProfile;
  onSaveSuccess?: () => void;
}

export default function CollegeProfileForm({ initialData, onSaveSuccess }: CollegeProfileFormProps) {
  const [profile, setProfile] = useState<CollegeProfile>(initialData);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMessage(false);
    try {
      const res = await fetch('/api/settings/general', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      if (res.ok) {
        setSavedMessage(true);
        if (onSaveSuccess) onSaveSuccess();
        setTimeout(() => setSavedMessage(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-5 md:p-8 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 space-y-6">
      <div className="flex items-center justify-between border-b border-outline/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary-container/40 text-primary">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-bold text-onSurface font-heading">
              ข้อมูลทั่วไปของสถานศึกษา (College Information)
            </h2>
            <p className="text-xs text-onSurface-muted mt-0.5">
              ข้อมูลที่ใช้แสดงผลในส่วนหัวของเอกสารรายงาน (PDF/Report) และหน้าล็อกอิน
            </p>
          </div>
        </div>
        {profile.logo_url && (
          <img src={profile.logo_url} alt="Logo" className="w-12 h-12 object-contain rounded-lg border border-outline/20 p-1 bg-white hidden sm:block" />
        )}
      </div>

      {savedMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>บันทึกข้อมูลสถานศึกษาเรียบร้อยแล้ว</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-onSurface block mb-1.5">ชื่อสถานศึกษา (ภาษาไทย) *</label>
          <input
            type="text"
            required
            value={profile.name_th}
            onChange={(e) => setProfile({ ...profile, name_th: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-surface border border-outline/30 rounded-xl focus:outline-none focus:border-primary font-semibold"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-onSurface block mb-1.5">ชื่อสถานศึกษา (English)</label>
          <input
            type="text"
            value={profile.name_en || ''}
            onChange={(e) => setProfile({ ...profile, name_en: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-surface border border-outline/30 rounded-xl focus:outline-none focus:border-primary"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-onSurface block mb-1.5">URL โลโก้วิทยาลัย</label>
          <input
            type="text"
            value={profile.logo_url || ''}
            onChange={(e) => setProfile({ ...profile, logo_url: e.target.value })}
            placeholder="/img/logofve.png"
            className="w-full px-3 py-2 text-xs bg-surface border border-outline/30 rounded-xl focus:outline-none focus:border-primary font-mono text-[11px]"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-onSurface block mb-1.5">ที่ตั้งสถานศึกษา (Address)</label>
          <textarea
            rows={2}
            value={profile.address || ''}
            onChange={(e) => setProfile({ ...profile, address: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-surface border border-outline/30 rounded-xl focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-onSurface block mb-1.5 flex items-center gap-1">
            <Phone className="w-3.5 h-3.5 text-onSurface-muted" />
            <span>เบอร์โทรศัพท์ติดต่อ</span>
          </label>
          <input
            type="text"
            value={profile.phone || ''}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-surface border border-outline/30 rounded-xl focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-onSurface block mb-1.5 flex items-center gap-1">
            <Mail className="w-3.5 h-3.5 text-onSurface-muted" />
            <span>อีเมลกลางสถานศึกษา</span>
          </label>
          <input
            type="email"
            value={profile.email || ''}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-surface border border-outline/30 rounded-xl focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-onSurface block mb-1.5 flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-onSurface-muted" />
            <span>เว็บไซต์หลัก</span>
          </label>
          <input
            type="url"
            value={profile.website || ''}
            onChange={(e) => setProfile({ ...profile, website: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-surface border border-outline/30 rounded-xl focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-onSurface block mb-1.5">เขตเวลาของระบบ (Timezone)</label>
          <select
            value={profile.timezone}
            onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
            className="w-full px-3 py-2 text-xs bg-surface border border-outline/30 rounded-xl focus:outline-none focus:border-primary"
          >
            <option value="Asia/Bangkok">Asia/Bangkok (GMT+7:00 Thailand)</option>
          </select>
        </div>
      </div>

      <div className="pt-4 border-t border-outline/15 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs md:text-sm font-bold hover:bg-primary-dark shadow-sm flex items-center gap-2 disabled:opacity-50 transition-all"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}</span>
        </button>
      </div>
    </form>
  );
}
