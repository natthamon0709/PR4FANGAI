'use client';
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
