'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SessionUser } from '@/types';
import { Bell, ChevronDown, User, Key, LogOut, Menu, ChevronRight } from 'lucide-react';
import RoleBadge from './RoleBadge';

interface TopNavbarProps {
  user: SessionUser;
  breadcrumbs?: { label: string; href?: string }[];
  onToggleSidebarMobile?: () => void;
}

export default function TopNavbar({
  user,
  breadcrumbs = [],
  onToggleSidebarMobile,
}: TopNavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const initials = `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`;

  return (
    <header className="h-16 px-4 md:px-6 glass-header border-b border-outline/40 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Left: Mobile hamburger & Breadcrumbs */}
      <div className="flex items-center gap-3">
        {onToggleSidebarMobile && (
          <button
            onClick={onToggleSidebarMobile}
            className="md:hidden p-2 rounded-xl text-onSurface-muted hover:text-onSurface hover:bg-surface-variant/80 transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Breadcrumb Navigation with refined Chevrons */}
        <nav className="flex items-center text-xs md:text-sm text-onSurface-muted font-medium">
          <Link href="/dashboard" className="hover:text-primary transition-colors">
            หน้าหลัก
          </Link>
          {breadcrumbs.map((b, i) => (
            <React.Fragment key={i}>
              <ChevronRight className="w-3.5 h-3.5 text-onSurface-muted/50 mx-1 flex-shrink-0" />
              {b.href ? (
                <Link href={b.href} className="hover:text-primary transition-colors">
                  {b.label}
                </Link>
              ) : (
                <span className="text-onSurface font-bold">{b.label}</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Right: Notifications & User Avatar Menu */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          className="p-2 rounded-xl text-onSurface-muted hover:text-onSurface hover:bg-surface-variant/70 border border-transparent hover:border-outline/40 relative transition-all duration-150"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-secondary rounded-full ring-2 ring-white" />
        </button>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-2xl hover:bg-surface-variant/70 border border-transparent hover:border-outline/40 transition-all duration-150"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold text-xs shadow-xs ring-1 ring-white">
              {initials || 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-onSurface truncate max-w-[130px]">
                {user.first_name} {user.last_name}
              </div>
              <div className="text-[10px] text-onSurface-muted truncate max-w-[130px]">
                {user.role === 'administrator' ? 'ผู้ดูแลระบบ' : user.sub_department_name || 'เจ้าหน้าที่'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-onSurface-muted hidden sm:block transition-transform duration-150" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="origin-top-right absolute right-0 mt-2 w-64 rounded-2xl shadow-level3 glass-card z-40 py-2 animate-scaleUp overflow-hidden">
              <div className="px-4 py-3 border-b border-outline/30 bg-surface/30">
                <p className="text-[11px] font-mono text-onSurface-muted">เข้าสู่ระบบในชื่อ</p>
                <p className="text-sm font-bold text-onSurface truncate">
                  {user.first_name} {user.last_name}
                </p>
                <p className="text-xs text-onSurface-muted font-mono truncate">{user.email}</p>
                <div className="mt-2">
                  <RoleBadge role={user.role} />
                </div>
              </div>

              <div className="py-1">
                <Link
                  href="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-onSurface hover:bg-surface-variant/70 transition-colors"
                >
                  <User className="w-4 h-4 text-primary" />
                  <span>โปรไฟล์ของฉัน</span>
                </Link>

                <Link
                  href="/profile/change-password"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-onSurface hover:bg-surface-variant/70 transition-colors"
                >
                  <Key className="w-4 h-4 text-secondary" />
                  <span>เปลี่ยนรหัสผ่าน</span>
                </Link>
              </div>

              <div className="pt-1 border-t border-outline/30">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-error hover:bg-error-container/40 text-left transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>ออกจากระบบ</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
