import React from 'react';
import { Role } from '@/types';
import { ShieldCheck, UserCheck } from 'lucide-react';

interface RoleRadioGroupProps {
  value: Role;
  onChange: (role: Role) => void;
  disabled?: boolean;
}

export default function RoleRadioGroup({ value, onChange, disabled = false }: RoleRadioGroupProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-onSurface mb-2">
        สิทธิ์การใช้งาน (Role) <span className="text-error">*</span>
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Administrator */}
        <label
          className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
            value === 'administrator'
              ? 'border-secondary bg-secondary-container/40 ring-2 ring-secondary/50'
              : 'border-outline/60 bg-surface-card hover:bg-surface-variant'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <input
            type="radio"
            name="role"
            value="administrator"
            checked={value === 'administrator'}
            onChange={() => onChange('administrator')}
            disabled={disabled}
            className="mt-0.5 text-secondary focus:ring-secondary"
          />
          <div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-onSurface">
              <ShieldCheck className="w-4 h-4 text-secondary" />
              <span>Administrator</span>
            </div>
            <p className="text-xs text-onSurface-muted mt-0.5">
              ผู้ดูแลระบบหลัก จัดการบัญชีผู้ใช้ สิทธิ์ และการเชื่อมต่อ AI / Sheets
            </p>
          </div>
        </label>

        {/* Staff */}
        <label
          className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
            value === 'staff'
              ? 'border-primary bg-primary-container/40 ring-2 ring-primary/50'
              : 'border-outline/60 bg-surface-card hover:bg-surface-variant'
          } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <input
            type="radio"
            name="role"
            value="staff"
            checked={value === 'staff'}
            onChange={() => onChange('staff')}
            disabled={disabled}
            className="mt-0.5 text-primary focus:ring-primary"
          />
          <div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-onSurface">
              <UserCheck className="w-4 h-4 text-primary" />
              <span>Staff</span>
            </div>
            <p className="text-xs text-onSurface-muted mt-0.5">
              เจ้าหน้าที่ประจำฝ่าย/งาน เข้าใช้งานจัดการองค์ความรู้ตามสังกัด
            </p>
          </div>
        </label>
      </div>
    </div>
  );
}
