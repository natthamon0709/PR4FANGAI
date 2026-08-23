'use client';
import React from 'react';
import { Department, SubDepartment } from '@/types';
import { Filter, Building, FolderTree, CheckCircle } from 'lucide-react';

interface KnowledgeFilterGroupProps {
  departments: Department[];
  subDepartments: SubDepartment[];
  selectedDept: string;
  selectedSubDept: string;
  selectedStatus: string;
  onDeptChange: (deptId: string) => void;
  onSubDeptChange: (subDeptId: string) => void;
  onStatusChange: (status: string) => void;
  isAdmin?: boolean;
}

export default function KnowledgeFilterGroup({
  departments = [],
  subDepartments = [],
  selectedDept,
  selectedSubDept,
  selectedStatus,
  onDeptChange,
  onSubDeptChange,
  onStatusChange,
  isAdmin = true,
}: KnowledgeFilterGroupProps) {
  const filteredSubDepts = selectedDept && selectedDept !== 'all'
    ? subDepartments.filter((s) => s.department_id === selectedDept)
    : subDepartments;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {/* Department Filter (Admin only or disabled for staff) */}
      {isAdmin && (
        <div className="flex items-center gap-1.5">
          <select
            value={selectedDept}
            onChange={(e) => onDeptChange(e.target.value)}
            className="h-10 px-3 rounded-xl border border-outline bg-surface-card text-xs text-onSurface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
          >
            <option value="all">ทุกฝ่าย (ทั้งหมด)</option>
            {departments.map((d) => (
              <option key={d.department_id} value={d.department_id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Sub-department Filter */}
      <div className="flex items-center gap-1.5">
        <select
          value={selectedSubDept}
          onChange={(e) => onSubDeptChange(e.target.value)}
          className="h-10 px-3 rounded-xl border border-outline bg-surface-card text-xs text-onSurface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
        >
          <option value="all">ทุกงาน/แผนก</option>
          {filteredSubDepts.map((s) => (
            <option key={s.sub_department_id} value={s.sub_department_id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* Status Filter */}
      <div className="flex items-center gap-1.5">
        <select
          value={selectedStatus}
          onChange={(e) => onStatusChange(e.target.value)}
          className="h-10 px-3 rounded-xl border border-outline bg-surface-card text-xs text-onSurface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
        >
          <option value="all">ทุกสถานะ</option>
          <option value="published">🟢 เผยแพร่แล้ว</option>
          <option value="draft">⚪ แบบร่าง</option>
          <option value="archived">🔴 เก็บถาวร</option>
        </select>
      </div>
    </div>
  );
}
