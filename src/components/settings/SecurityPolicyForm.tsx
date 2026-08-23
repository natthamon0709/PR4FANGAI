'use client';
import React, { useState } from 'react';
import { SecurityPolicy } from '@/types/settings';
import { ShieldCheck, RotateCcw, Save, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface SecurityPolicyFormProps {
  initialPolicy: SecurityPolicy;
  onSaveSuccess?: () => void;
}

export default function SecurityPolicyForm({ initialPolicy, onSaveSuccess }: SecurityPolicyFormProps) {
  const [policy, setPolicy] = useState<SecurityPolicy>(initialPolicy);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMessage(false);
    try {
      const res = await fetch('/api/settings/security', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(policy)
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

  const handleResetDefault = async () => {
    if (confirm('คุณต้องการรีเซ็ตนโยบายความปลอดภัยกลับเป็นค่าเริ่มต้นมาตรฐานใช่หรือไม่?')) {
      setSaving(true);
      try {
        const res = await fetch('/api/settings/security', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'reset_default' })
        });
        if (res.ok) {
          const d = await res.json();
          setPolicy(d.policy);
          setSavedMessage(true);
          setTimeout(() => setSavedMessage(false), 3000);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <form onSubmit={handleSave} className="p-5 md:p-8 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 space-y-6">
      <div className="flex items-center justify-between border-b border-outline/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary-container/40 text-primary">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-bold text-onSurface font-heading">
              นโยบายความปลอดภัยระบบ (Security Policies)
            </h2>
            <p className="text-xs text-onSurface-muted mt-0.5">
              กำหนดข้อบังคับรหัสผ่าน การป้องกัน Brute Force และระยะเวลาหมดอายุของ Session
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetDefault}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-outline/30 hover:border-primary text-onSurface-muted hover:text-primary transition-all flex items-center gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>คืนค่าเริ่มต้น</span>
        </button>
      </div>

      {savedMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>บันทึกนโยบายความปลอดภัยเรียบร้อยแล้ว มีผลบังคับใช้ทันที</span>
        </div>
      )}

      {/* Section 1: Password Policies */}
      <div className="space-y-4">
        <h3 className="text-xs md:text-sm font-bold text-primary uppercase tracking-wider">
          1. นโยบายรหัสผ่าน (Password Policy)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-onSurface block mb-1">ความยาวรหัสผ่านขั้นต่ำ (ตัวอักษร)</label>
            <select
              value={policy.password_min_length}
              onChange={(e) => setPolicy({ ...policy, password_min_length: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs bg-surface border border-outline/30 rounded-xl focus:outline-none focus:border-primary font-semibold"
            >
              <option value={6}>6 ตัวอักษร</option>
              <option value={8}>8 ตัวอักษร (มาตรฐานแนะนำ)</option>
              <option value={10}>10 ตัวอักษร (ความปลอดภัยสูง)</option>
              <option value={12}>12 ตัวอักษร (เข้มงวดสูงสุด)</option>
            </select>
            <p className="text-[11.5px] text-onSurface-muted mt-1">
              ผลกระทบ: ผู้ใช้ที่ตั้งรหัสผ่านใหม่หรือเปลี่ยนรหัสผ่านจะต้องมีความยาวไม่น้อยกว่าค่านี้
            </p>
          </div>

          <div className="flex flex-col justify-start">
            <label className="text-xs font-bold text-onSurface block mb-2">ข้อบังคับความซับซ้อนของรหัสผ่าน</label>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={policy.password_require_complexity}
                onChange={(e) => setPolicy({ ...policy, password_require_complexity: e.target.checked })}
                className="w-4 h-4 text-primary rounded border-outline/30 focus:ring-primary"
              />
              <span className="text-xs font-medium text-onSurface">ต้องมีตัวพิมพ์ใหญ่และตัวเลขผสม</span>
            </label>
            <p className="text-[11.5px] text-onSurface-muted mt-1.5">
              ผลกระทบ: ป้องกันการตั้งรหัสผ่านง่าย เช่น 123456 หรือ password
            </p>
          </div>
        </div>
      </div>

      {/* Section 2: Login & Session Policies */}
      <div className="space-y-4 pt-4 border-t border-outline/15">
        <h3 className="text-xs md:text-sm font-bold text-primary uppercase tracking-wider">
          2. การเข้าสู่ระบบและการหมดเวลา (Login & Session Controls)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-bold text-onSurface block mb-1">จำนวนครั้งล็อกอินผิดพลาดก่อนล็อกบัญชี</label>
            <select
              value={policy.max_login_attempts}
              onChange={(e) => setPolicy({ ...policy, max_login_attempts: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs bg-surface border border-outline/30 rounded-xl focus:outline-none focus:border-primary font-semibold"
            >
              <option value={3}>3 ครั้ง (เข้มงวด)</option>
              <option value={5}>5 ครั้ง (แนะนำ)</option>
              <option value={10}>10 ครั้ง (ยืดหยุ่น)</option>
            </select>
            <p className="text-[11.5px] text-onSurface-muted mt-1">
              ผลกระทบ: ป้องกันการเดารหัสผ่าน หากเกินจำนวนระบบจะระงับบัญชีชั่วคราว
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-onSurface block mb-1">ระยะเวลาล็อกบัญชีชั่วคราว (นาที)</label>
            <select
              value={policy.lockout_duration_minutes}
              onChange={(e) => setPolicy({ ...policy, lockout_duration_minutes: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs bg-surface border border-outline/30 rounded-xl focus:outline-none focus:border-primary font-semibold"
            >
              <option value={5}>5 นาที</option>
              <option value={15}>15 นาที (แนะนำ)</option>
              <option value={30}>30 นาที</option>
              <option value={60}>60 นาที (1 ชั่วโมง)</option>
            </select>
            <p className="text-[11.5px] text-onSurface-muted mt-1">
              ผลกระทบ: ระยะเวลาที่ผู้ใช้ต้องรอเพื่อลองเข้าสู่ระบบใหม่
            </p>
          </div>

          <div>
            <label className="text-xs font-bold text-onSurface block mb-1">Session Timeout อัตโนมัติ (ชั่วโมง)</label>
            <select
              value={policy.session_timeout_hours}
              onChange={(e) => setPolicy({ ...policy, session_timeout_hours: Number(e.target.value) })}
              className="w-full px-3 py-2 text-xs bg-surface border border-outline/30 rounded-xl focus:outline-none focus:border-primary font-semibold"
            >
              <option value={1}>1 ชั่วโมง</option>
              <option value={2}>2 ชั่วโมง (มาตรฐาน)</option>
              <option value={4}>4 ชั่วโมง</option>
              <option value={8}>8 ชั่วโมง (ตลอดวันทำงาน)</option>
            </select>
            <p className="text-[11.5px] text-onSurface-muted mt-1">
              ผลกระทบ: ออกจากระบบอัตโนมัติเมื่อไม่มีการเคลื่อนไหวเกินระยะเวลาที่กำหนด
            </p>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-outline/15 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs md:text-sm font-bold hover:bg-primary-dark shadow-sm flex items-center gap-2 disabled:opacity-50 transition-all"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{saving ? 'กำลังบันทึก...' : 'บันทึกนโยบายความปลอดภัย'}</span>
        </button>
      </div>
    </form>
  );
}
