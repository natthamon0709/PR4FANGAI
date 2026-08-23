'use client';
import React from 'react';
import { Users, UserCheck, Shield } from 'lucide-react';
import { BroadcastTargetType } from '@/types/line';

interface AudienceSelectorProps {
  targetType: BroadcastTargetType;
  onTargetTypeChange: (t: BroadcastTargetType) => void;
  departmentId?: string;
  onDepartmentChange?: (deptId: string) => void;
  departments: { department_id: string; name: string }[];
  totalFollowersCount: number;
  linkedStaffCount: number;
  isAdmin?: boolean;
  disabled?: boolean;
}

export default function AudienceSelector({
  targetType,
  onTargetTypeChange,
  departmentId,
  onDepartmentChange,
  departments,
  totalFollowersCount,
  linkedStaffCount,
  isAdmin = true,
  disabled = false
}: AudienceSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-xs font-bold text-onSurface block">
        กลุ่มเป้าหมายผู้รับข้อความ (Target Audience):
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Target 1: All Followers (Admin only) */}
        {isAdmin ? (
          <label
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
              targetType === 'all_followers'
                ? 'border-[#00B900] bg-[#00B900]/5 shadow-level1'
                : 'border-outline/30 bg-surface-card hover:border-outline/60'
            } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <input
              type="radio"
              name="broadcast_target"
              value="all_followers"
              checked={targetType === 'all_followers'}
              onChange={() => onTargetTypeChange('all_followers')}
              className="sr-only"
              disabled={disabled}
            />
            <div className="w-10 h-10 rounded-2xl bg-[#00B900]/10 flex items-center justify-center text-[#00B900] flex-shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-heading font-bold text-xs text-onSurface">ผู้ติดตามทั้งหมด</span>
                <span className="text-lg font-heading font-extrabold text-[#00B900]">
                  {totalFollowersCount.toLocaleString()} คน
                </span>
              </div>
              <p className="text-[11px] text-onSurface-muted mt-0.5">
                ส่งถึงนักเรียน นักศึกษา ผู้ปกครอง และประชาชนที่ติดตาม LINE OA
              </p>
            </div>
          </label>
        ) : null}

        {/* Target 2: Linked Staff Department */}
        <label
          className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
            targetType === 'linked_staff_department'
              ? 'border-primary bg-primary-container/20 shadow-level1'
              : 'border-outline/30 bg-surface-card hover:border-outline/60'
          } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input
            type="radio"
            name="broadcast_target"
            value="linked_staff_department"
            checked={targetType === 'linked_staff_department'}
            onChange={() => onTargetTypeChange('linked_staff_department')}
            className="sr-only"
            disabled={disabled}
          />
          <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-xs text-onSurface">เจ้าหน้าที่เฉพาะฝ่าย</span>
              <span className="text-lg font-heading font-extrabold text-primary">
                {linkedStaffCount} คน
              </span>
            </div>
            <p className="text-[11px] text-onSurface-muted mt-0.5">
              แจ้งเตือนเฉพาะบุคลากรที่ผูกบัญชี LINE ในฝ่ายงานที่เลือก
            </p>
          </div>
        </label>
      </div>

      {/* Select Department if target is linked staff */}
      {targetType === 'linked_staff_department' && isAdmin && (
        <div className="pt-1">
          <label className="block text-[11px] font-semibold text-onSurface mb-1">
            เลือกฝ่ายงานเป้าหมาย:
          </label>
          <select
            value={departmentId || ''}
            onChange={(e) => onDepartmentChange?.(e.target.value)}
            disabled={disabled}
            className="w-full h-10 px-3 rounded-xl border border-outline bg-surface text-xs text-onSurface outline-none focus:border-primary cursor-pointer"
          >
            <option value="">-- กรุณาเลือกฝ่ายงาน --</option>
            {departments.map((d) => (
              <option key={d.department_id} value={d.department_id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
