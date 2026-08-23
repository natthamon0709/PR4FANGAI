'use client';
import React, { useEffect, useState } from 'react';
import { Department, SubDepartment } from '@/types';

interface DepartmentSelectorProps {
  selectedDepartmentId: string;
  selectedSubDepartmentId: string;
  onDepartmentChange: (deptId: string) => void;
  onSubDepartmentChange: (subDeptId: string) => void;
  disabled?: boolean;
  required?: boolean;
}

export default function DepartmentSelector({
  selectedDepartmentId,
  selectedSubDepartmentId,
  onDepartmentChange,
  onSubDepartmentChange,
  disabled = false,
  required = true,
}: DepartmentSelectorProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subDepartments, setSubDepartments] = useState<SubDepartment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDepts() {
      try {
        const res = await fetch('/api/departments');
        const data = await res.json();
        setDepartments(data.departments || []);
        setSubDepartments(data.subDepartments || []);
      } catch (err) {
        console.error('Failed to load departments', err);
      } finally {
        setLoading(false);
      }
    }
    loadDepts();
  }, []);

  // Filter sub-departments based on selected department
  const filteredSubDepts = subDepartments.filter(
    (s) => s.department_id === selectedDepartmentId
  );

  const handleDeptSelect = (deptId: string) => {
    onDepartmentChange(deptId);
    // Reset sub-department if changed
    const available = subDepartments.filter((s) => s.department_id === deptId);
    if (available.length > 0) {
      onSubDepartmentChange(available[0].sub_department_id);
    } else {
      onSubDepartmentChange('');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 1. Department Dropdown */}
      <div>
        <label className="block text-sm font-medium text-onSurface mb-1.5">
          ฝ่ายที่สังกัด {required && <span className="text-error">*</span>}
        </label>
        <select
          value={selectedDepartmentId}
          onChange={(e) => handleDeptSelect(e.target.value)}
          disabled={disabled || loading}
          required={required}
          className="w-full h-12 px-3.5 rounded-lg border border-outline bg-surface-card text-onSurface text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          <option value="">-- กรุณาเลือกฝ่าย --</option>
          {departments.map((dept) => (
            <option key={dept.department_id} value={dept.department_id}>
              {dept.name} ({dept.code})
            </option>
          ))}
        </select>
      </div>

      {/* 2. Sub-Department Dependent Dropdown */}
      <div>
        <label className="block text-sm font-medium text-onSurface mb-1.5">
          งานที่สังกัด {required && <span className="text-error">*</span>}
        </label>
        <select
          value={selectedSubDepartmentId}
          onChange={(e) => onSubDepartmentChange(e.target.value)}
          disabled={disabled || !selectedDepartmentId || loading}
          required={required}
          className="w-full h-12 px-3.5 rounded-lg border border-outline bg-surface-card text-onSurface text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          <option value="">
            {!selectedDepartmentId ? '-- กรุณาเลือกฝ่ายก่อน --' : '-- กรุณาเลือกงาน --'}
          </option>
          {filteredSubDepts.map((sub) => (
            <option key={sub.sub_department_id} value={sub.sub_department_id}>
              {sub.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
