'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import DepartmentSelector from './DepartmentSelector';
import RoleRadioGroup from './RoleRadioGroup';
import AuthButton from './AuthButton';
import SessionAlert from './SessionAlert';
import { User, Role, Status } from '@/types';
import { User as UserIcon, Mail, Phone, Lock, MessageSquare, Save, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface UserFormPanelProps {
  initialData?: Partial<User>;
  isEdit?: boolean;
}

export default function UserFormPanel({ initialData, isEdit = false }: UserFormPanelProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdTempPass, setCreatedTempPass] = useState('');

  const [formData, setFormData] = useState({
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    department_id: initialData?.department_id || '',
    sub_department_id: initialData?.sub_department_id || '',
    role: (initialData?.role || 'staff') as Role,
    status: (initialData?.status || 'active') as Status,
    line_user_id: initialData?.line_user_id || '',
    password: '',
  });

  const handleGeneratePassword = () => {
    const generated = `Fang@${Math.floor(1000 + Math.random() * 9000)}`;
    setFormData((prev) => ({ ...prev, password: generated }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setCreatedTempPass('');

    if (!formData.first_name || !formData.last_name || !formData.email) {
      setError('กรุณากรอกชื่อ นามสกุล และอีเมล');
      return;
    }

    if (!formData.department_id || !formData.sub_department_id) {
      setError('กรุณาเลือกฝ่ายและงานที่สังกัดให้ครบถ้วน');
      return;
    }

    setLoading(true);

    try {
      const url = isEdit ? `/api/users/${initialData?.user_id}` : '/api/users';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        return;
      }

      setSuccess(data.message || 'บันทึกข้อมูลสำเร็จ');
      if (data.user?.tempPassword) {
        setCreatedTempPass(data.user.tempPassword);
      }

      if (!isEdit && !data.user?.tempPassword) {
        setTimeout(() => {
          router.push('/users');
          router.refresh();
        }, 1500);
      }
    } catch (err: any) {
      setError('เกิดข้อผิดพลาดในการเชื่อมต่อ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <SessionAlert type="error" message={error} onClose={() => setError('')} />}
      {success && <SessionAlert type="success" message={success} />}

      {createdTempPass && (
        <div className="p-4 rounded-xl bg-secondary-container/50 border border-secondary text-onSurface space-y-2 animate-scaleUp">
          <h4 className="font-heading font-bold text-secondary-dark flex items-center gap-2 text-sm">
            <Lock className="w-4 h-4 text-secondary" />
            <span>รหัสผ่านชั่วคราวสำหรับผู้ใช้งานใหม่</span>
          </h4>
          <p className="text-xs text-onSurface-variant">
            โปรดบันทึกรหัสผ่านนี้และส่งให้ผู้ใช้งานสำหรับเข้าสู่ระบบครั้งแรก:
          </p>
          <div className="flex items-center gap-3 pt-1">
            <code className="px-3 py-1.5 bg-surface-card rounded-lg border border-secondary/40 font-mono text-base font-bold text-primary tracking-wider">
              {createdTempPass}
            </code>
            <Link
              href="/users"
              className="text-xs font-semibold text-primary hover:underline ml-auto"
            >
              กลับหน้ารายชื่อผู้ใช้ →
            </Link>
          </div>
        </div>
      )}

      {/* Section 1: ข้อมูลส่วนตัว */}
      <div className="p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 space-y-5">
        <h3 className="text-base font-heading font-bold text-onSurface flex items-center gap-2 pb-3 border-b border-outline/20">
          <UserIcon className="w-4 h-4 text-primary" />
          <span>ข้อมูลส่วนตัว (Personal Information)</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-onSurface mb-1.5">
              ชื่อ <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              required
              placeholder="เช่น สมชาย"
              className="w-full h-12 px-3.5 rounded-lg border border-outline bg-surface-card text-onSurface text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-onSurface mb-1.5">
              นามสกุล <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              required
              placeholder="เช่น ใจดี"
              className="w-full h-12 px-3.5 rounded-lg border border-outline bg-surface-card text-onSurface text-sm focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-onSurface mb-1.5">
              อีเมลของวิทยาลัย <span className="text-error">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
                disabled={isEdit} // อีเมลห้ามแก้หลังสร้างเพื่อความปลอดภัย
                placeholder="somchai@fang.ac.th"
                className="w-full h-12 pl-10 pr-3.5 rounded-lg border border-outline bg-surface-card text-onSurface text-sm focus:ring-2 focus:ring-primary focus:border-primary disabled:bg-surface-variant/50 font-mono"
              />
              <Mail className="w-4 h-4 absolute left-3.5 top-4 text-onSurface-muted" />
            </div>
            {isEdit && <p className="text-[11px] text-onSurface-muted mt-1">ไม่อนุญาตให้แก้อีเมลที่เป็น ID หลัก</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-onSurface mb-1.5">
              เบอร์โทรศัพท์
            </label>
            <div className="relative">
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="เช่น 0812345678"
                className="w-full h-12 pl-10 pr-3.5 rounded-lg border border-outline bg-surface-card text-onSurface text-sm focus:ring-2 focus:ring-primary focus:border-primary font-mono"
              />
              <Phone className="w-4 h-4 absolute left-3.5 top-4 text-onSurface-muted" />
            </div>
          </div>
        </div>

        {/* LINE User ID (เตรียมสำหรับ Phase 6 LINE OA) */}
        <div>
          <label className="block text-sm font-medium text-onSurface mb-1.5">
            LINE User ID <span className="text-xs text-onSurface-muted font-normal">(เชื่อมต่อ Phase 6 & AI LINE OA)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={formData.line_user_id}
              onChange={(e) => setFormData({ ...formData, line_user_id: e.target.value })}
              placeholder="เช่น U1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6"
              className="w-full h-12 pl-10 pr-3.5 rounded-lg border border-outline bg-surface-card text-onSurface text-sm focus:ring-2 focus:ring-primary focus:border-primary font-mono"
            />
            <MessageSquare className="w-4 h-4 absolute left-3.5 top-4 text-[#06C755]" />
          </div>
          <p className="text-[11px] text-onSurface-muted mt-1">
            ใช้สำหรับการยืนยันสิทธิ์อัตโนมัติเมื่อถามคำถามผ่าน LINE OA ของวิทยาลัย
          </p>
        </div>
      </div>

      {/* Section 2: สังกัดและสิทธิ์ */}
      <div className="p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 space-y-5">
        <h3 className="text-base font-heading font-bold text-onSurface pb-3 border-b border-outline/20">
          สังกัดและสิทธิ์การใช้งาน (Department & Role)
        </h3>

        {/* 2-Level Dependent Dropdown */}
        <DepartmentSelector
          selectedDepartmentId={formData.department_id}
          selectedSubDepartmentId={formData.sub_department_id}
          onDepartmentChange={(deptId) => setFormData((prev) => ({ ...prev, department_id: deptId }))}
          onSubDepartmentChange={(subDeptId) => setFormData((prev) => ({ ...prev, sub_department_id: subDeptId }))}
        />

        {/* Role Radio Group */}
        <RoleRadioGroup
          value={formData.role}
          onChange={(role) => setFormData((prev) => ({ ...prev, role }))}
        />

        {/* Status Option */}
        <div>
          <label className="block text-sm font-medium text-onSurface mb-2">
            สถานะบัญชี (Account Status) <span className="text-error">*</span>
          </label>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-onSurface cursor-pointer">
              <input
                type="radio"
                name="status"
                value="active"
                checked={formData.status === 'active'}
                onChange={() => setFormData({ ...formData, status: 'active' })}
                className="text-success focus:ring-success"
              />
              <span className="font-medium text-success">🟢 เปิดใช้งาน (Active)</span>
            </label>

            <label className="flex items-center gap-2 text-sm text-onSurface cursor-pointer">
              <input
                type="radio"
                name="status"
                value="suspended"
                checked={formData.status === 'suspended'}
                onChange={() => setFormData({ ...formData, status: 'suspended' })}
                className="text-error focus:ring-error"
              />
              <span className="font-medium text-error">🔴 ปิดใช้งาน (Suspended)</span>
            </label>
          </div>
        </div>

        {/* Temporary Password setting (only on create) */}
        {!isEdit && (
          <div className="pt-2 border-t border-outline/20">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium text-onSurface">
                รหัสผ่านเริ่มต้น <span className="text-xs text-onSurface-muted font-normal">(เว้นว่างเพื่อสุ่มอัตโนมัติ)</span>
              </label>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>สุ่มรหัสผ่าน</span>
              </button>
            </div>
            <input
              type="text"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="เว้นว่างเพื่อให้ระบบสุ่มรหัสผ่านอัตโนมัติ เช่น Fang@5821"
              className="w-full h-12 px-3.5 rounded-lg border border-outline bg-surface-card text-onSurface text-sm font-mono focus:ring-2 focus:ring-primary"
            />
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/users"
          className="px-5 py-2.5 rounded-lg border border-outline text-sm font-medium text-onSurface hover:bg-surface-variant transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>ยกเลิก</span>
        </Link>
        <AuthButton
          type="submit"
          loading={loading}
          fullWidth={false}
          className="px-6"
        >
          <Save className="w-4 h-4" />
          <span>{isEdit ? 'บันทึกการแก้ไข' : 'สร้างบัญชีผู้ใช้งาน'}</span>
        </AuthButton>
      </div>
    </form>
  );
}
