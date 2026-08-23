const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

ensureDir('./src/components/settings');

// 1. SettingsTabNav
fs.writeFileSync('./src/components/settings/SettingsTabNav.tsx', `'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  FolderTree,
  ShieldCheck,
  Bell,
  History,
  DatabaseBackup,
  Layers,
  UserCheck
} from 'lucide-react';

interface SettingsTabNavProps {
  isAdmin?: boolean;
}

export default function SettingsTabNav({ isAdmin = true }: SettingsTabNavProps) {
  const pathname = usePathname();

  const tabs = [
    ...(isAdmin
      ? [
          { label: 'ข้อมูลวิทยาลัย', href: '/settings/general', icon: Building2, exact: true },
          { label: 'โครงสร้างฝ่ายและงาน', href: '/settings/departments', icon: FolderTree },
          { label: 'นโยบายความปลอดภัย', href: '/settings/security', icon: ShieldCheck },
          { label: 'การแจ้งเตือนระบบ', href: '/settings/notifications', icon: Bell },
          { label: 'บันทึกกิจกรรม (Audit Log)', href: '/settings/audit-log', icon: History },
          { label: 'สำรองและกู้คืนข้อมูล', href: '/settings/backup', icon: DatabaseBackup },
          { label: 'ศูนย์รวมการเชื่อมต่อ', href: '/settings/integrations', icon: Layers },
        ]
      : []),
    { label: 'การตั้งค่าส่วนตัว', href: '/settings/my-preferences', icon: UserCheck },
  ];

  return (
    <div className="border-b border-outline/20 bg-surface-card rounded-xl px-2 mb-6 shadow-sm overflow-x-auto">
      <nav className="flex space-x-1 sm:space-x-2 h-11 min-w-max">
        {tabs.map((tab) => {
          const isActive = tab.exact ? (pathname === tab.href || pathname === '/settings') : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={\`flex items-center gap-2 px-3.5 h-full text-xs md:text-sm font-semibold transition-all border-b-[3px] \${
                isActive
                  ? 'border-primary text-primary font-bold bg-primary-container/20'
                  : 'border-transparent text-onSurface-muted hover:text-onSurface hover:border-outline/40'
              }\`}
            >
              <Icon className={\`w-4 h-4 \${isActive ? 'text-primary' : 'text-onSurface-muted'}\`} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
`, 'utf8');

// C95: CollegeProfileForm
fs.writeFileSync('./src/components/settings/CollegeProfileForm.tsx', `'use client';
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
`, 'utf8');

// C96: DepartmentTreeView & C97: AddSubDepartmentButton & C98: DeleteProtectionDialog
fs.writeFileSync('./src/components/settings/DepartmentTreeView.tsx', `'use client';
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
      await fetch(\`/api/settings/departments/\${id}\`, {
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
      await fetch(\`/api/settings/sub-departments/\${id}\`, {
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
              className={\`rounded-2xl border transition-all \${
                dept.is_active
                  ? 'bg-surface-card border-outline/30 shadow-level1'
                  : 'bg-slate-50/60 border-dashed border-slate-300 opacity-75'
              }\`}
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
                          className={\`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all \${
                            sub.is_active
                              ? 'bg-surface border-outline/20 hover:border-outline/40'
                              : 'bg-slate-50 border-dashed border-slate-300 opacity-70'
                          }\`}
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
`, 'utf8');

// C98: DeleteProtectionDialog
fs.writeFileSync('./src/components/settings/DeleteProtectionDialog.tsx', `'use client';
import React, { useState } from 'react';
import { AlertTriangle, Power, Trash2, X, Loader2 } from 'lucide-react';

interface DeleteProtectionDialogProps {
  isOpen: boolean;
  type: 'department' | 'sub_department';
  id: string;
  name: string;
  userCount: number;
  knowledgeCount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteProtectionDialog({
  isOpen,
  type,
  id,
  name,
  userCount,
  knowledgeCount,
  onClose,
  onSuccess
}: DeleteProtectionDialogProps) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const hasReferences = userCount > 0 || knowledgeCount > 0;
  const endpoint = type === 'department' ? \`/api/settings/departments/\${id}\` : \`/api/settings/sub-departments/\${id}\`;

  const handleDeactivate = async () => {
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch(\`\${endpoint}?force=deactivate\`, { method: 'DELETE' });
      if (res.ok) {
        onSuccess();
      } else {
        const d = await res.json();
        setError(d.error || 'เกิดข้อผิดพลาดในการปิดใช้งาน');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleHardDelete = async () => {
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        onSuccess();
      } else {
        const d = await res.json();
        setError(d.error || 'ไม่สามารถลบรายการได้');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-surface-card rounded-2xl border-2 border-error/30 shadow-level3 max-w-lg w-full p-6 space-y-4 animate-scaleUp">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FBE9E7] text-error rounded-xl flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base md:text-lg text-onSurface">
                {hasReferences ? 'พบข้อมูลที่ยังผูกอยู่กับรายการนี้' : 'ยืนยันการลบรายการ'}
              </h3>
              <p className="text-xs text-onSurface-muted mt-0.5">
                {type === 'department' ? 'ฝ่าย:' : 'งานย่อย:'} <span className="font-bold text-onSurface">{name}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-onSurface-muted hover:text-onSurface rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {hasReferences ? (
          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-[#FBE9E7] border border-error/30 rounded-xl text-error-dark space-y-1.5">
              <p className="font-bold">⚠️ ไม่แนะนำให้ลบถาวร (Hard Delete)</p>
              <p>เนื่องจากมีข้อมูลในระบบที่อ้างอิงถึงรายการนี้อยู่ ได้แก่:</p>
              <ul className="list-disc pl-5 space-y-0.5 font-semibold">
                <li>บัญชีผู้ใช้งาน: <span className="font-bold text-error">{userCount} คน</span></li>
                <li>บทความองค์ความรู้: <span className="font-bold text-error">{knowledgeCount} รายการ</span></li>
              </ul>
              <p className="pt-1 text-[11px]">
                การลบถาวรจะทำให้ข้อมูลประวัติศาสตร์และสถิติเดิมเสียหาย ระบบขอเสนอให้เลือก <strong>"ปิดใช้งาน"</strong> เพื่อซ่อนจากแบบฟอร์มใหม่แต่ยังคงประวัติไว้
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-onSurface-muted">
            ไม่มีผู้ใช้งานหรือบทความองค์ความรู้ผูกอยู่กับรายการนี้ คุณสามารถลบรายการนี้ออกจากฐานข้อมูลได้อย่างปลอดภัย
          </p>
        )}

        {error && (
          <div className="p-2.5 bg-error-container/30 text-error rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-outline/20">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-onSurface-muted hover:text-onSurface"
          >
            ยกเลิก
          </button>

          {hasReferences ? (
            <button
              type="button"
              onClick={handleDeactivate}
              disabled={processing}
              className="w-full sm:w-auto px-4 py-2 bg-secondary text-secondary-dark font-bold rounded-xl text-xs hover:bg-secondary/80 flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
              <span>ปิดใช้งานแทน (แนะนำ)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleHardDelete}
              disabled={processing}
              className="w-full sm:w-auto px-4 py-2 bg-error text-white font-bold rounded-xl text-xs hover:bg-error-dark flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              <span>ยืนยันลบถาวร</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
`, 'utf8');

// C99: SecurityPolicyForm
fs.writeFileSync('./src/components/settings/SecurityPolicyForm.tsx', `'use client';
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
`, 'utf8');

// C100: NotificationRuleTable
fs.writeFileSync('./src/components/settings/NotificationRuleTable.tsx', `'use client';
import React, { useState } from 'react';
import { NotificationRule, NotificationChannel, NotificationRole } from '@/types/settings';
import { Bell, Smartphone, Mail, Layout, Power, Check, Loader2 } from 'lucide-react';

interface NotificationRuleTableProps {
  initialRules: NotificationRule[];
  onRefresh: () => void;
}

export default function NotificationRuleTable({ initialRules, onRefresh }: NotificationRuleTableProps) {
  const [rules, setRules] = useState<NotificationRule[]>(initialRules);
  const [savingId, setSavingId] = useState<string | null>(null);

  const eventLabels: Record<string, { title: string; desc: string }> = {
    pending_review: {
      title: 'องค์ความรู้รอตรวจสอบ (Pending Review)',
      desc: 'เมื่อมีเจ้าหน้าที่สร้างหรือแก้ไขบทความและส่งให้อนุมัติ'
    },
    knowledge_approved: {
      title: 'องค์ความรู้ได้รับการอนุมัติ (Knowledge Approved)',
      desc: 'เมื่อบทความได้รับการอนุมัติและเผยแพร่ลงคลังความรู้'
    },
    knowledge_sent_back: {
      title: 'องค์ความรู้ถูกส่งกลับแก้ไข (Sent Back for Edits)',
      desc: 'เมื่อผู้ดูแลระบบส่งข้อคิดเห็นให้เจ้าหน้าที่ปรับปรุงบทความ'
    },
    sync_error: {
      title: 'Google Sheets ซิงค์ผิดพลาด (Sync Error)',
      desc: 'เมื่อเกิดข้อผิดพลาดในการเชื่อมต่อหรืออ่านเขียนข้อมูลชีท'
    },
    sync_conflict: {
      title: 'เกิดข้อขัดแย้งข้อมูล 2 ทาง (Sync Conflict)',
      desc: 'เมื่อข้อมูลในระบบและ Google Sheet มีการแก้ไขพร้อมกัน'
    }
  };

  const handleToggleActive = async (rule: NotificationRule) => {
    setSavingId(rule.rule_id);
    try {
      await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule_id: rule.rule_id,
          is_active: !rule.is_active
        })
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleChannel = async (rule: NotificationRule, channel: NotificationChannel) => {
    setSavingId(rule.rule_id);
    const channels = rule.notify_channels.includes(channel)
      ? rule.notify_channels.filter(c => c !== channel)
      : [...rule.notify_channels, channel];

    if (channels.length === 0) {
      setSavingId(null);
      return; // At least one channel required
    }

    try {
      await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rule_id: rule.rule_id,
          notify_channels: channels
        })
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="p-5 md:p-8 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 space-y-6">
      <div className="flex items-center gap-3 border-b border-outline/20 pb-4">
        <div className="p-2.5 rounded-xl bg-primary-container/40 text-primary">
          <Bell className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base md:text-lg font-bold text-onSurface font-heading">
            กฎการแจ้งเตือนระดับระบบ (System Notification Rules)
          </h2>
          <p className="text-xs text-onSurface-muted mt-0.5">
            กำหนดว่าเมื่อเกิดเหตุการณ์สำคัญในระบบ จะส่งการแจ้งเตือนถึงใครผ่านช่องทางใด
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-outline/20 text-onSurface-muted bg-surface/50">
              <th className="p-3 font-bold">ประเภทเหตุการณ์</th>
              <th className="p-3 font-bold">กลุ่มผู้รับแจ้งเตือน</th>
              <th className="p-3 font-bold">ช่องทางการแจ้งเตือน</th>
              <th className="p-3 font-bold text-right">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline/10">
            {initialRules.map((rule) => {
              const info = eventLabels[rule.event_type] || { title: rule.event_type, desc: '' };
              const isBusy = savingId === rule.rule_id;

              return (
                <tr key={rule.rule_id} className="hover:bg-primary-container/5 transition-colors">
                  <td className="p-3.5 max-w-xs">
                    <p className="font-bold text-onSurface text-xs md:text-sm">{info.title}</p>
                    <p className="text-[11px] text-onSurface-muted mt-0.5">{info.desc}</p>
                  </td>

                  <td className="p-3.5">
                    <div className="flex flex-wrap gap-1">
                      {rule.notify_roles.map((role) => (
                        <span
                          key={role}
                          className={\`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase \${
                            role === 'administrator' ? 'bg-secondary/20 text-secondary-dark' : 'bg-primary-container text-primary'
                          }\`}
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5">
                      {/* In-app */}
                      <button
                        type="button"
                        onClick={() => handleToggleChannel(rule, 'in_app')}
                        className={\`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-all \${
                          rule.notify_channels.includes('in_app')
                            ? 'bg-primary-container/40 border-primary text-primary'
                            : 'bg-surface border-outline/30 text-onSurface-muted opacity-50'
                        }\`}
                      >
                        <Layout className="w-3 h-3" />
                        <span>เว็บ (In-app)</span>
                      </button>

                      {/* LINE */}
                      <button
                        type="button"
                        onClick={() => handleToggleChannel(rule, 'line')}
                        className={\`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-all \${
                          rule.notify_channels.includes('line')
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-700 font-bold'
                            : 'bg-surface border-outline/30 text-onSurface-muted opacity-50'
                        }\`}
                      >
                        <Smartphone className="w-3 h-3 text-emerald-600" />
                        <span>LINE Push</span>
                      </button>

                      {/* Email */}
                      <button
                        type="button"
                        onClick={() => handleToggleChannel(rule, 'email')}
                        className={\`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition-all \${
                          rule.notify_channels.includes('email')
                            ? 'bg-blue-50 border-blue-400 text-blue-700'
                            : 'bg-surface border-outline/30 text-onSurface-muted opacity-50'
                        }\`}
                      >
                        <Mail className="w-3 h-3 text-blue-600" />
                        <span>อีเมล</span>
                      </button>
                    </div>
                  </td>

                  <td className="p-3.5 text-right">
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => handleToggleActive(rule)}
                      className={\`px-3 py-1 rounded-lg text-xs font-semibold border transition-all inline-flex items-center gap-1.5 \${
                        rule.is_active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
                      }\`}
                    >
                      {isBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
                      <span>{rule.is_active ? 'เปิดใช้งาน' : 'ปิด'}</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`, 'utf8');

// C101: AuditLogTable
fs.writeFileSync('./src/components/settings/AuditLogTable.tsx', `'use client';
import React, { useState } from 'react';
import { SystemAuditLog } from '@/types/settings';
import RelativeTimeLabel from '@/components/dashboard/RelativeTimeLabel';
import { History, Shield, Filter, Search, User } from 'lucide-react';

interface AuditLogTableProps {
  logs: SystemAuditLog[];
  onFilterChange: (action?: string) => void;
}

export default function AuditLogTable({ logs, onFilterChange }: AuditLogTableProps) {
  const [selectedAction, setSelectedAction] = useState<string>('all');

  const actionLabels: Record<string, string> = {
    update_college_profile: 'แก้ไขข้อมูลสถานศึกษา',
    create_department: 'เพิ่มฝ่ายใหม่',
    update_department: 'แก้ไขฝ่าย',
    deactivate_department: 'ปิดใช้งานฝ่าย',
    delete_department: 'ลบฝ่ายถาวร',
    create_sub_department: 'เพิ่มงานย่อยใหม่',
    update_sub_department: 'แก้ไขงานย่อย',
    deactivate_sub_department: 'ปิดใช้งานงานย่อย',
    delete_sub_department: 'ลบงานย่อยถาวร',
    update_security_policy: 'ปรับนโยบายความปลอดภัย',
    update_notification_rule: 'ปรับกฎการแจ้งเตือน',
    create_backup: 'สร้างไฟล์สำรองข้อมูล',
    init_system_settings: 'เริ่มต้นระบบการตั้งค่า'
  };

  const handleSelectChange = (val: string) => {
    setSelectedAction(val);
    onFilterChange(val === 'all' ? undefined : val);
  };

  return (
    <div className="p-5 md:p-8 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-outline/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary-container/40 text-primary">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base md:text-lg font-bold text-onSurface font-heading">
              บันทึกกิจกรรมผู้ดูแลระบบ (System Audit Trail)
            </h2>
            <p className="text-xs text-onSurface-muted mt-0.5">
              ประวัติการเปลี่ยนแปลงค่าตั้งระบบ โครงสร้างฝ่าย และนโยบายความปลอดภัย
            </p>
          </div>
        </div>

        {/* Filter dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-onSurface-muted" />
          <select
            value={selectedAction}
            onChange={(e) => handleSelectChange(e.target.value)}
            className="px-3 py-1.5 text-xs bg-surface border border-outline/30 rounded-xl focus:outline-none focus:border-primary"
          >
            <option value="all">ทุกกิจกรรม (ทั้งหมด)</option>
            <option value="update_college_profile">แก้ไขข้อมูลวิทยาลัย</option>
            <option value="create_department">เพิ่มฝ่าย</option>
            <option value="update_department">แก้ไขฝ่าย</option>
            <option value="create_sub_department">เพิ่มงานย่อย</option>
            <option value="update_security_policy">นโยบายความปลอดภัย</option>
            <option value="update_notification_rule">กฎการแจ้งเตือน</option>
            <option value="create_backup">สำรองข้อมูล</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-outline/20 text-onSurface-muted bg-surface/50">
              <th className="p-3 font-semibold">ผู้ดำเนินการ (Admin)</th>
              <th className="p-3 font-semibold">การกระทำ (Action)</th>
              <th className="p-3 font-semibold">เป้าหมาย (Target)</th>
              <th className="p-3 font-semibold">รายละเอียด</th>
              <th className="p-3 font-semibold text-right">เวลาที่ทำรายการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline/10">
            {logs.map((log) => (
              <tr key={log.log_id} className="hover:bg-primary-container/5 transition-colors">
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
                      {log.actor_name?.[0] || 'A'}
                    </div>
                    <div>
                      <p className="font-bold text-onSurface">{log.actor_name || 'ผู้ดูแลระบบ'}</p>
                      <p className="text-[10px] text-onSurface-muted">{log.actor_email}</p>
                    </div>
                  </div>
                </td>

                <td className="p-3">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-container text-primary">
                    {actionLabels[log.action] || log.action}
                  </span>
                </td>

                <td className="p-3 font-mono text-[11px] text-onSurface-muted">
                  {log.target_type} ({log.target_id || '-'})
                </td>

                <td className="p-3 text-[11px] text-onSurface max-w-xs truncate font-mono">
                  {JSON.stringify(log.detail)}
                </td>

                <td className="p-3 text-right text-onSurface-muted">
                  <RelativeTimeLabel dateString={log.created_at} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`, 'utf8');

// C102: BackupTriggerCard
fs.writeFileSync('./src/components/settings/BackupTriggerCard.tsx', `'use client';
import React, { useState } from 'react';
import { BackupJob } from '@/types/settings';
import RelativeTimeLabel from '@/components/dashboard/RelativeTimeLabel';
import { DatabaseBackup, Download, Play, CheckCircle2, Clock, Loader2 } from 'lucide-react';

interface BackupTriggerCardProps {
  backups: BackupJob[];
  onRefresh: () => void;
}

export default function BackupTriggerCard({ backups, onRefresh }: BackupTriggerCardProps) {
  const [triggering, setTriggering] = useState(false);

  const handleBackupNow = async () => {
    setTriggering(true);
    try {
      const res = await fetch('/api/settings/backup', { method: 'POST' });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTriggering(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Trigger Hero Card */}
      <div className="p-6 md:p-8 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <DatabaseBackup className="w-4 h-4" />
            <span>ระบบสำรองข้อมูลอัตโนมัติ (Automated Database Backup)</span>
          </div>
          <h2 className="text-base md:text-lg font-bold text-onSurface font-heading">
            สำรองฐานข้อมูลระบบทันที (On-demand Backup)
          </h2>
          <p className="text-xs text-onSurface-muted max-w-xl">
            สร้างสำเนา Snapshot ฐานข้อมูล SQLite พร้อมข้อมูลโครงสร้างทั้งหมด ไฟล์สำรองจะถูกเก็บรักษาไว้อย่างปลอดภัยและดาวน์โหลดได้ภายใน 30 วัน
          </p>
        </div>

        <button
          type="button"
          disabled={triggering}
          onClick={handleBackupNow}
          className="px-5 py-3 bg-primary text-white rounded-xl text-xs md:text-sm font-bold hover:bg-primary-dark shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all flex-shrink-0"
        >
          {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
          <span>{triggering ? 'กำลังสำรองข้อมูล...' : 'สำรองข้อมูลตอนนี้'}</span>
        </button>
      </div>

      {/* Backup History Table */}
      <div className="p-5 md:p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 space-y-4">
        <h3 className="font-heading font-bold text-sm md:text-base text-onSurface flex items-center gap-2 border-b border-outline/20 pb-3">
          <Clock className="w-4 h-4 text-primary" />
          <span>ประวัติไฟล์สำรองข้อมูล (Backup History)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-outline/20 text-onSurface-muted bg-surface/50">
                <th className="p-3 font-semibold">รหัสสำรองข้อมูล</th>
                <th className="p-3 font-semibold">ประเภท</th>
                <th className="p-3 font-semibold">ขนาดไฟล์</th>
                <th className="p-3 font-semibold">ผู้ดำเนินการ</th>
                <th className="p-3 font-semibold">เวลาที่สร้าง</th>
                <th className="p-3 font-semibold text-right">ดาวน์โหลด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/10">
              {backups.map((b) => (
                <tr key={b.backup_id} className="hover:bg-primary-container/5 transition-colors">
                  <td className="p-3 font-mono font-bold text-primary">{b.backup_id}</td>
                  <td className="p-3">
                    <span className={\`px-2 py-0.5 rounded-full text-[10px] font-bold \${
                      b.triggered_by === 'manual' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }\`}>
                      {b.triggered_by === 'manual' ? 'สั่งด้วยตนเอง' : 'ตามตารางเวลา'}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-onSurface">{formatBytes(b.file_size)}</td>
                  <td className="p-3 text-onSurface-muted">{b.creator_name || 'ผู้ดูแลระบบ'}</td>
                  <td className="p-3 text-onSurface-muted">
                    <RelativeTimeLabel dateString={b.created_at} />
                  </td>
                  <td className="p-3 text-right">
                    {b.file_url ? (
                      <a
                        href={b.file_url}
                        download
                        className="px-3 py-1 bg-surface border border-outline/30 hover:border-primary text-primary rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>ดาวน์โหลด (.db)</span>
                      </a>
                    ) : (
                      <span className="text-onSurface-muted text-[11px]">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
`, 'utf8');

// C103: IntegrationStatusCard
fs.writeFileSync('./src/components/settings/IntegrationStatusCard.tsx', `'use client';
import React from 'react';
import Link from 'next/link';
import { IntegrationItem } from '@/types/settings';
import { FileSpreadsheet, Bot, Smartphone, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface IntegrationStatusCardProps {
  item: IntegrationItem;
}

export default function IntegrationStatusCard({ item }: IntegrationStatusCardProps) {
  const iconMap: Record<string, any> = {
    sheets: FileSpreadsheet,
    ai: Bot,
    line: Smartphone
  };

  const Icon = iconMap[item.key] || Bot;
  const isConnected = item.status === 'connected';

  return (
    <div className="p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 hover:shadow-level2 transition-all flex flex-col justify-between group">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="p-3 rounded-xl bg-primary-container/40 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
            <Icon className="w-7 h-7" />
          </div>
          <span className={\`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 \${
            isConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-rose-50 text-rose-700 border border-rose-300'
          }\`}>
            {isConnected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            <span>{item.statusLabel}</span>
          </span>
        </div>

        <div>
          <h3 className="font-heading font-bold text-base text-onSurface">{item.title}</h3>
        </div>

        {/* Details Table */}
        <div className="p-3 bg-surface rounded-xl border border-outline/20 space-y-1.5 text-xs">
          {item.details.map((d, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-onSurface-muted">{d.label}:</span>
              <span className="font-semibold text-onSurface">{d.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer shortcut link */}
      <div className="pt-4 mt-4 border-t border-outline/15 flex justify-end">
        <Link
          href={item.settingsUrl}
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
        >
          <span>ไปที่การตั้งค่าบริการนี้</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
`, 'utf8');

// C104: PersonalNotificationForm
fs.writeFileSync('./src/components/settings/PersonalNotificationForm.tsx', `'use client';
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
                className={\`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all select-none \${
                  isChecked ? 'bg-primary-container/20 border-primary' : 'bg-surface border-outline/20'
                }\`}
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
`, 'utf8');

console.log('All Phase 8 UI Components (C95 - C104) created successfully!');
