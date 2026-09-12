import React from 'react';
import Link from 'next/link';
import { User } from '@/types';
import StatusBadge from './StatusBadge';
import RoleBadge from './RoleBadge';
import UserRowActionMenu from './UserRowActionMenu';
import { User as UserIcon, Phone, Mail, Building, Clock } from 'lucide-react';

interface UserTableProps {
  users: User[];
  loading: boolean;
  onToggleStatus: (user: User) => void;
  onResetPassword: (user: User) => void;
  onDelete: (user: User) => void;
}

export default function UserTable({
  users,
  loading,
  onToggleStatus,
  onResetPassword,
  onDelete,
}: UserTableProps) {
  if (loading) {
    return (
      <div className="py-16 text-center text-onSurface-muted">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium">กำลังโหลดข้อมูลผู้ใช้งาน...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="py-16 text-center text-onSurface-muted bg-surface-card rounded-xl border border-outline/30 my-4">
        <UserIcon className="w-12 h-12 mx-auto mb-3 opacity-30 text-onSurface" />
        <h4 className="font-heading text-base font-bold text-onSurface mb-1">ไม่พบข้อมูลผู้ใช้งาน</h4>
        <p className="text-xs text-onSurface-muted">ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองใหม่อีกครั้ง</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Desktop & Tablet Table (≥ 768px) */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-outline/40 bg-surface-card shadow-card">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-surface-variant/60 text-onSurface-variant font-mono text-[11px] font-bold uppercase tracking-wider border-b border-outline/30">
              <th className="py-3.5 px-4">ชื่อ-นามสกุล</th>
              <th className="py-3.5 px-4">อีเมล / ติดต่อ</th>
              <th className="py-3.5 px-4">ฝ่าย / งานที่สังกัด</th>
              <th className="py-3.5 px-4 text-center">สิทธิ์</th>
              <th className="py-3.5 px-4 text-center">สถานะ</th>
              <th className="py-3.5 px-4 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline/25">
            {users.map((user, idx) => {
              const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`;
              return (
                <tr
                  key={user.user_id}
                  className={`hover:bg-primary/[0.03] transition-colors duration-150 ${
                    idx % 2 === 1 ? 'bg-surface/30' : 'bg-surface-card'
                  }`}
                >
                  {/* Name & Avatar */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs">
                        {initials || 'U'}
                      </div>
                      <div>
                        <Link
                          href={`/users/${user.user_id}`}
                          className="font-semibold text-onSurface hover:text-primary hover:underline transition-colors"
                        >
                          {user.first_name} {user.last_name}
                        </Link>
                        {user.line_user_id && (
                          <span className="ml-2 inline-flex items-center px-1.5 py-0.2 bg-[#06C755]/15 text-[#06C755] rounded-md text-[10px] font-semibold border border-[#06C755]/20">
                            LINE Linked
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Email & Phone */}
                  <td className="py-3.5 px-4 text-xs text-onSurface-variant">
                    <div className="flex items-center gap-1.5 text-onSurface font-mono">
                      <Mail className="w-3.5 h-3.5 text-onSurface-muted/80" />
                      <span>{user.email}</span>
                    </div>
                    {user.phone && (
                      <div className="flex items-center gap-1.5 text-onSurface-muted mt-0.5 font-mono text-[11px]">
                        <Phone className="w-3 h-3" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                  </td>

                  {/* Department & Sub Department */}
                  <td className="py-3.5 px-4 text-xs">
                    <div className="font-semibold text-onSurface flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5 text-primary" />
                      <span>{user.department_name || '-'}</span>
                    </div>
                    <div className="text-onSurface-muted mt-0.5 pl-5 text-[11px]">
                      {user.sub_department_name || '-'}
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-3.5 px-4 text-center">
                    <RoleBadge role={user.role} />
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 text-center">
                    <StatusBadge status={user.status} />
                  </td>

                  {/* Action Menu */}
                  <td className="py-3.5 px-4 text-right">
                    <UserRowActionMenu
                      user={user}
                      onToggleStatus={onToggleStatus}
                      onResetPassword={onResetPassword}
                      onDelete={onDelete}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List (< 768px as per Section 9) */}
      <div className="block md:hidden space-y-3">
        {users.map((user) => {
          const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`;
          return (
            <div
              key={user.user_id}
              className="p-4 rounded-2xl bg-surface-card border border-outline/40 shadow-card space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-primary/5 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-xs">
                    {initials || 'U'}
                  </div>
                  <div>
                    <Link
                      href={`/users/${user.user_id}`}
                      className="font-bold text-sm text-onSurface hover:text-primary"
                    >
                      {user.first_name} {user.last_name}
                    </Link>
                    <p className="text-xs text-onSurface-muted font-mono">{user.email}</p>
                  </div>
                </div>
                <UserRowActionMenu
                  user={user}
                  onToggleStatus={onToggleStatus}
                  onResetPassword={onResetPassword}
                  onDelete={onDelete}
                />
              </div>

              <div className="text-xs text-onSurface-variant bg-surface-variant/50 p-2.5 rounded-xl space-y-1 border border-outline/30">
                <div className="font-semibold text-onSurface">{user.department_name || '-'}</div>
                <div className="text-onSurface-muted text-[11px]">{user.sub_department_name || '-'}</div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-outline/30">
                <RoleBadge role={user.role} />
                <StatusBadge status={user.status} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
