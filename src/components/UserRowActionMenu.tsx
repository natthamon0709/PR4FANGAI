'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MoreVertical, Edit2, Key, UserX, UserCheck, Trash2, Eye } from 'lucide-react';
import { User } from '@/types';

interface UserRowActionMenuProps {
  user: User;
  onToggleStatus: (user: User) => void;
  onResetPassword: (user: User) => void;
  onDelete: (user: User) => void;
}

export default function UserRowActionMenu({
  user,
  onToggleStatus,
  onResetPassword,
  onDelete,
}: UserRowActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg text-onSurface-muted hover:text-onSurface hover:bg-surface-variant transition-colors"
        aria-label="Actions menu"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-1 w-48 rounded-xl shadow-level2 bg-surface-card border border-outline/30 z-30 py-1.5 animate-fadeIn">
          {/* View Details */}
          <Link
            href={`/users/${user.user_id}`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-onSurface hover:bg-surface-variant transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-primary" />
            <span>ดูรายละเอียด</span>
          </Link>

          {/* Edit */}
          <Link
            href={`/users/${user.user_id}/edit`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-onSurface hover:bg-surface-variant transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 text-secondary" />
            <span>แก้ไขข้อมูล</span>
          </Link>

          {/* Reset Password */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onResetPassword(user);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-onSurface hover:bg-surface-variant text-left transition-colors"
          >
            <Key className="w-3.5 h-3.5 text-secondary-dark" />
            <span>รีเซ็ตรหัสผ่าน</span>
          </button>

          <hr className="my-1 border-outline/30" />

          {/* Toggle Active / Suspended */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onToggleStatus(user);
            }}
            className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-left transition-colors ${
              user.status === 'active'
                ? 'text-error hover:bg-error-container/40'
                : 'text-success hover:bg-success-container/40'
            }`}
          >
            {user.status === 'active' ? (
              <>
                <UserX className="w-3.5 h-3.5" />
                <span>ระงับการใช้งาน</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5" />
                <span>เปิดใช้งานบัญชี</span>
              </>
            )}
          </button>

          {/* Delete */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onDelete(user);
            }}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-error hover:bg-error-container/40 text-left transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>ลบบัญชีผู้ใช้</span>
          </button>
        </div>
      )}
    </div>
  );
}
