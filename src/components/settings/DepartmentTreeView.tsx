'use client';
import React, { useState } from 'react';
import { DepartmentTreeNode, SubDepartmentNode } from '@/types/settings';
import {
  ChevronRight,
  ChevronDown,
  Building,
  Plus,
  Edit2,
  Trash2,
  Users,
  BookOpen,
  Power,
  FolderTree,
  Save,
  X
} from 'lucide-react';
import DeleteProtectionDialog from './DeleteProtectionDialog';

interface DepartmentTreeViewProps {
  departments: DepartmentTreeNode[];
  onRefresh: () => void;
}

export default function DepartmentTreeView({ departments, onRefresh }: DepartmentTreeViewProps) {
  const [expandedDepts, setExpandedDepts] = useState<Record<string, boolean>>({
    'dept-01-resource': true,
    'dept-02-planning': true,
    'dept-03-student': true,
    'dept-04-academic': true
  });

  // Adding state
  const [addingDept, setAddingDept] = useState(false);
  const [newDeptName, setNewDeptName] = useState('');
  const [newDeptCode, setNewDeptCode] = useState('');

  const [addingSubForDeptId, setAddingSubForDeptId] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState('');
  const [newSubCode, setNewSubCode] = useState('');

  // Editing state
  const [editingDeptId, setEditingDeptId] = useState<string | null>(null);
  const [editDeptName, setEditDeptName] = useState('');
  const [editDeptCode, setEditDeptCode] = useState('');

  const [editingSubId, setEditingSubId] = useState<string | null>(null);
  const [editSubName, setEditSubName] = useState('');
  const [editSubCode, setEditSubCode] = useState('');

  // Delete Protection Dialog state
  const [protectionModal, setProtectionModal] = useState<{
    isOpen: boolean;
    type: 'department' | 'sub_department';
    id: string;
    name: string;
    userCount: number;
    knowledgeCount: number;
  }>({
    isOpen: false,
    type: 'department',
    id: '',
    name: '',
    userCount: 0,
    knowledgeCount: 0
  });

  const toggleExpand = (id: string) => {
    setExpandedDepts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName || !newDeptCode) return;
    try {
      await fetch('/api/settings/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDeptName, code: newDeptCode })
      });
      setAddingDept(false);
      setNewDeptName('');
      setNewDeptCode('');
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateDept = async (id: string) => {
    try {
      await fetch(`/api/settings/departments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editDeptName, code: editDeptCode })
      });
      setEditingDeptId(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateSub = async (deptId: string) => {
    if (!newSubName || !newSubCode) return;
    try {
      await fetch('/api/settings/sub-departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department_id: deptId, name: newSubName, code: newSubCode })
      });
      setAddingSubForDeptId(null);
      setNewSubName('');
      setNewSubCode('');
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateSub = async (id: string) => {
    try {
      await fetch(`/api/settings/sub-departments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editSubName, code: editSubCode })
      });
      setEditingSubId(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDeptClick = (dept: DepartmentTreeNode) => {
    setProtectionModal({
      isOpen: true,
      type: 'department',
      id: dept.department_id,
      name: dept.name,
      userCount: dept.linked_users_count,
      knowledgeCount: dept.linked_knowledge_count
    });
  };

  const handleDeleteSubClick = (sub: SubDepartmentNode) => {
    setProtectionModal({
      isOpen: true,
      type: 'sub_department',
      id: sub.sub_department_id,
      name: sub.name,
      userCount: sub.linked_users_count,
      knowledgeCount: sub.linked_knowledge_count
    });
  };

  return (
    <div className="space-y-4">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base md:text-lg font-bold text-onSurface font-heading flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-primary" />
            <span>ผังโครงสร้าง 4 ฝ่ายหลักและงานย่อย (Organizational Tree)</span>
          </h2>
          <p className="text-xs text-onSurface-muted mt-0.5">
            โครงสร้างหลักที่เป็นต้นทางของระบบบุคลากร (Phase 1) และคลังความรู้ (Phase 3)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddingDept(!addingDept)}
          className="px-3 py-1.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-dark shadow-sm flex items-center gap-1 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>เพิ่มฝ่ายใหม่</span>
        </button>
      </div>

      {/* Add Department Inline Form */}
      {addingDept && (
        <form onSubmit={handleCreateDept} className="p-4 bg-primary-container/20 border-2 border-primary/40 rounded-2xl flex flex-wrap items-center gap-3">
          <span className="text-xs font-bold text-primary">เพิ่มฝ่ายใหม่:</span>
          <input
            type="text"
            required
            placeholder="ชื่อฝ่าย เช่น ฝ่ายวิเทศสัมพันธ์"
            value={newDeptName}
            onChange={(e) => setNewDeptName(e.target.value)}
            className="px-3 py-1.5 text-xs bg-surface border border-outline/30 rounded-lg flex-1 min-w-[180px]"
          />
          <input
            type="text"
            required
            placeholder="รหัสฝ่าย เช่น FOR"
            value={newDeptCode}
            onChange={(e) => setNewDeptCode(e.target.value.toUpperCase())}
            className="px-3 py-1.5 text-xs bg-surface border border-outline/30 rounded-lg w-28 font-mono"
          />
          <button type="submit" className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold hover:bg-primary-dark">
            บันทึก
          </button>
          <button type="button" onClick={() => setAddingDept(false)} className="px-2.5 py-1.5 text-xs text-onSurface-muted hover:text-onSurface">
            ยกเลิก
          </button>
        </form>
      )}

      {/* Tree Nodes List */}
      <div className="space-y-3">
        {departments.map((dept, deptIdx) => {
          const isExpanded = Boolean(expandedDepts[dept.department_id]);
          const isEditing = editingDeptId === dept.department_id;

          return (
            <div
              key={dept.department_id}
              className={`rounded-2xl border transition-all ${
                dept.is_active
                  ? 'bg-surface-card border-outline/30 shadow-level1'
                  : 'bg-slate-50/60 border-dashed border-slate-300 opacity-75'
              }`}
            >
              {/* Department Header */}
              <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-variant/20 rounded-t-2xl border-b border-outline/15">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => toggleExpand(dept.department_id)}
                    className="p-1 rounded-lg hover:bg-outline/15 text-onSurface-muted transition-transform"
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>

                  <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {deptIdx + 1}
                  </div>

                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        value={editDeptName}
                        onChange={(e) => setEditDeptName(e.target.value)}
                        className="px-2 py-1 text-xs bg-surface border border-outline/40 rounded-lg flex-1"
                      />
                      <input
                        type="text"
                        value={editDeptCode}
                        onChange={(e) => setEditDeptCode(e.target.value.toUpperCase())}
                        className="px-2 py-1 text-xs bg-surface border border-outline/40 rounded-lg w-20 font-mono"
                      />
                      <button onClick={() => handleUpdateDept(dept.department_id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingDeptId(null)} className="p-1 text-onSurface-muted hover:bg-surface rounded">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-bold text-sm md:text-base text-onSurface truncate">
                          {dept.name}
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-surface border border-outline/30 text-onSurface-muted">
                          {dept.code}
                        </span>
                        {!dept.is_active && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                            ปิดใช้งาน
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-onSurface-muted mt-0.5">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-primary" />
                          <span>{dept.linked_users_count} ผู้ใช้งาน</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3 text-secondary" />
                          <span>{dept.linked_knowledge_count} บทความ KM</span>
                        </span>
                        <span>• {dept.sub_departments.length} งานย่อย</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Department Action Buttons */}
                <div className="flex items-center gap-1 sm:self-center self-end flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setAddingSubForDeptId(dept.department_id);
                      setExpandedDepts(prev => ({ ...prev, [dept.department_id]: true }));
                    }}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold text-primary bg-primary-container/40 hover:bg-primary hover:text-white transition-all flex items-center gap-1"
                    title="เพิ่มงานย่อยภายใต้ฝ่ายนี้"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ งานย่อย</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingDeptId(dept.department_id);
                      setEditDeptName(dept.name);
                      setEditDeptCode(dept.code);
                    }}
                    className="p-1.5 text-onSurface-muted hover:text-onSurface hover:bg-outline/10 rounded-lg transition-colors"
                    title="แก้ไขชื่อฝ่าย"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteDeptClick(dept)}
                    className="p-1.5 text-error hover:bg-error-container/30 rounded-lg transition-colors"
                    title="ลบหรือปิดใช้งานฝ่าย"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Sub-departments List */}
              {isExpanded && (
                <div className="p-4 space-y-2 pl-6 sm:pl-10">
                  {/* Inline Add Sub-department form */}
                  {addingSubForDeptId === dept.department_id && (
                    <div className="p-3 bg-secondary/10 border border-secondary/30 rounded-xl flex flex-wrap items-center gap-2 mb-3">
                      <span className="text-xs font-bold text-secondary-dark">เพิ่มงานย่อย:</span>
                      <input
                        type="text"
                        placeholder="ชื่องาน เช่น งานวิเทศสัมพันธ์และทุน"
                        value={newSubName}
                        onChange={(e) => setNewSubName(e.target.value)}
                        className="px-2.5 py-1 text-xs bg-surface border border-outline/30 rounded-lg flex-1 min-w-[150px]"
                      />
                      <input
                        type="text"
                        placeholder="รหัส เช่น FOR-SCH"
                        value={newSubCode}
                        onChange={(e) => setNewSubCode(e.target.value.toUpperCase())}
                        className="px-2.5 py-1 text-xs bg-surface border border-outline/30 rounded-lg w-28 font-mono"
                      />
                      <button onClick={() => handleCreateSub(dept.department_id)} className="px-3 py-1 bg-primary text-white rounded-lg text-xs font-bold">
                        บันทึก
                      </button>
                      <button onClick={() => setAddingSubForDeptId(null)} className="px-2 py-1 text-xs text-onSurface-muted">
                        ยกเลิก
                      </button>
                    </div>
                  )}

                  {dept.sub_departments.length === 0 ? (
                    <p className="text-xs text-onSurface-muted py-2 italic">ยังไม่มีงานย่อยภายใต้ฝ่ายนี้</p>
                  ) : (
                    dept.sub_departments.map((sub) => {
                      const isSubEditing = editingSubId === sub.sub_department_id;

                      return (
                        <div
                          key={sub.sub_department_id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                            sub.is_active
                              ? 'bg-surface border-outline/20 hover:border-outline/40'
                              : 'bg-slate-50 border-dashed border-slate-300 opacity-70'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                            {isSubEditing ? (
                              <div className="flex items-center gap-2 flex-1">
                                <input
                                  type="text"
                                  value={editSubName}
                                  onChange={(e) => setEditSubName(e.target.value)}
                                  className="px-2 py-1 text-xs bg-surface border border-outline/40 rounded-lg flex-1"
                                />
                                <input
                                  type="text"
                                  value={editSubCode}
                                  onChange={(e) => setEditSubCode(e.target.value.toUpperCase())}
                                  className="px-2 py-1 text-xs bg-surface border border-outline/40 rounded-lg w-24 font-mono"
                                />
                                <button onClick={() => handleUpdateSub(sub.sub_department_id)} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => setEditingSubId(null)} className="p-1 text-onSurface-muted rounded">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs md:text-sm font-semibold text-onSurface truncate">{sub.name}</span>
                                  <span className="text-[10px] font-mono text-onSurface-muted px-1.5 py-0.2 bg-surface-variant/50 rounded">
                                    {sub.code}
                                  </span>
                                  {!sub.is_active && (
                                    <span className="text-[9px] px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full font-bold">
                                      ปิดใช้งาน
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-[10px] text-onSurface-muted mt-0.5">
                                  <span>{sub.linked_users_count} ผู้ใช้</span>
                                  <span>•</span>
                                  <span>{sub.linked_knowledge_count} องค์ความรู้</span>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSubId(sub.sub_department_id);
                                setEditSubName(sub.name);
                                setEditSubCode(sub.code);
                              }}
                              className="p-1 text-onSurface-muted hover:text-onSurface rounded transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSubClick(sub)}
                              className="p-1 text-error hover:bg-error-container/30 rounded transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Delete Protection Dialog Component */}
      <DeleteProtectionDialog
        isOpen={protectionModal.isOpen}
        type={protectionModal.type}
        id={protectionModal.id}
        name={protectionModal.name}
        userCount={protectionModal.userCount}
        knowledgeCount={protectionModal.knowledgeCount}
        onClose={() => setProtectionModal(prev => ({ ...prev, isOpen: false }))}
        onSuccess={() => {
          setProtectionModal(prev => ({ ...prev, isOpen: false }));
          onRefresh();
        }}
      />
    </div>
  );
}
