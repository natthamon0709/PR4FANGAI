'use client';
import React, { useEffect, useState } from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { Department } from '@/types';

interface UserFilterGroupProps {
  departmentId: string;
  role: string;
  status: string;
  onDepartmentChange: (val: string) => void;
  onRoleChange: (val: string) => void;
  onStatusChange: (val: string) => void;
  onReset: () => void;
}

export default function UserFilterGroup({
  departmentId,
  role,
  status,
  onDepartmentChange,
  onRoleChange,
  onStatusChange,
  onReset,
}: UserFilterGroupProps) {
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    async function loadDepts() {
      try {
        const res = await fetch('/api/departments');
        const data = await res.json();
        setDepartments(data.departments || []);
      } catch (e) {
        console.error(e);
      }
    }
    loadDepts();
  }, []);

  const hasFilter = departmentId || role || status;

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* Department Filter */}
      <select
        value={departmentId}
        onChange={(e) => onDepartmentChange(e.target.value)}
        className="h-11 px-3.5 rounded-xl border border-outline/70 bg-surface/50 hover:bg-surface/80 focus:bg-white text-xs font-medium text-onSurface focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary transition-all duration-150 cursor-pointer"
      >
        <option value="">ทุกฝ่าย (All Departments)</option>
        {departments.map((d) => (
          <option key={d.department_id} value={d.department_id}>
            {d.name}
          </option>
        ))}
      </select>

      {/* Role Filter */}
      <select
        value={role}
        onChange={(e) => onRoleChange(e.target.value)}
        className="h-11 px-3.5 rounded-xl border border-outline/70 bg-surface/50 hover:bg-surface/80 focus:bg-white text-xs font-medium text-onSurface focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary transition-all duration-150 cursor-pointer"
      >
        <option value="">ทุกสิทธิ์ (All Roles)</option>
        <option value="administrator">Administrator</option>
        <option value="staff">Staff</option>
      </select>

      {/* Status Filter */}
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value)}
        className="h-11 px-3.5 rounded-xl border border-outline/70 bg-surface/50 hover:bg-surface/80 focus:bg-white text-xs font-medium text-onSurface focus:outline-none focus:ring-4 focus:ring-primary/15 focus:border-primary transition-all duration-150 cursor-pointer"
      >
        <option value="">ทุกสถานะ (All Status)</option>
        <option value="active">เปิดใช้งาน (Active)</option>
        <option value="suspended">ปิดใช้งาน (Suspended)</option>
      </select>

      {hasFilter && (
        <button
          onClick={onReset}
          className="h-11 px-3.5 rounded-xl border border-outline/70 text-xs font-medium text-onSurface-muted hover:text-onSurface hover:bg-surface-variant/80 flex items-center gap-1.5 transition-all shadow-xs active:scale-95"
          title="ล้างตัวกรอง"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>ล้างตัวกรอง</span>
        </button>
      )}
    </div>
  );
}
