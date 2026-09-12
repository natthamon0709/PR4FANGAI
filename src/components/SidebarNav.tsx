'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SessionUser } from '@/types';
import AppLogo from './AppLogo';
import {
  LayoutDashboard,
  BookOpen,
  FileSpreadsheet,
  Users,
  BarChart3,
  Bot,
  ShieldCheck,
  Zap,
  Smartphone,
  Send,
  LayoutGrid,
  Settings,
  UserCheck,
  X,
  LucideIcon
} from 'lucide-react';

interface MenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  adminOnly?: boolean;
  badge?: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

interface SidebarNavProps {
  user: SessionUser;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export default function SidebarNav({
  user,
  isOpenMobile = false,
  onCloseMobile,
}: SidebarNavProps) {
  const pathname = usePathname();
  const isAdmin = user.role === 'administrator';

  const menuItems: MenuGroup[] = [
    {
      title: 'Phase 2: Dashboard',
      items: [
        { label: 'แดชบอร์ดภาพรวม', href: '/dashboard', icon: LayoutDashboard, exact: true },
      ],
    },
    {
      title: 'Phase 1: จัดการผู้ใช้งาน',
      items: [
        { label: 'จัดการผู้ใช้งาน (Users)', href: '/users', icon: Users, adminOnly: true },
        { label: 'บันทึกการเข้าระบบ (Audit Logs)', href: '/audit-logs', icon: ShieldCheck, adminOnly: true },
        { label: 'การเชื่อมต่อ API & n8n', href: '/integrations', icon: Zap, adminOnly: true },
      ],
    },
    {
      title: 'ระบบจัดการองค์ความรู้ (KM)',
      items: [
        { label: 'คลังองค์ความรู้ (KM)', href: '/knowledge', icon: BookOpen },
      ],
    },
    {
      title: 'ระบบปัญญาประดิษฐ์ (AI Engine)',
      items: [
        { label: 'ตั้งค่าเครื่องมือ AI', href: '/ai-engine/settings', icon: Zap, adminOnly: true, badge: 'Admin' },
        { label: 'ทดสอบ AI (Playground)', href: '/ai-engine/playground', icon: Bot, badge: 'Live' },
        { label: 'บันทึกการสนทนา (AI Logs)', href: '/ai-logs', icon: ShieldCheck },
      ],
    },
    {
      title: 'LINE Official Account (Phase 6)',
      items: [
        { label: 'ภาพรวม LINE OA', href: '/line-oa', icon: Smartphone, badge: 'LINE', exact: true },
        { label: 'จัดการ Rich Menu', href: '/line-oa/rich-menu', icon: LayoutGrid, adminOnly: true },
        { label: 'ส่งข้อความประชาสัมพันธ์', href: '/line-oa/broadcast', icon: Send },
        { label: 'รายชื่อผู้ติดตาม', href: '/line-oa/followers', icon: Users, adminOnly: true },
      ],
    },
    {
      title: 'สถิติและรายงาน',
      items: [
        { label: 'สถิติและรายงานผล', href: '/analytics', icon: BarChart3, badge: 'Phase 7' },
      ],
    },
    {
      title: 'การตั้งค่าระบบ (Phase 8)',
      items: [
        { label: 'ตั้งค่าระบบส่วนกลาง', href: '/settings', icon: Settings, adminOnly: true, badge: 'Phase 8' },
        { label: 'การตั้งค่าส่วนตัว', href: '/settings/my-preferences', icon: UserCheck },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-surface-card border-r border-outline/40 select-none">
      {/* Brand Header */}
      <div className="p-4 bg-gradient-to-br from-[#720000] via-[#800000] to-[#500000] border-b border-amber-500/30 flex items-center justify-between shadow-xs relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-28 h-28 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
        <AppLogo variant="dark" />
        {isOpenMobile && onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-colors md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {menuItems.map((group, groupIdx) => {
          const visibleItems = group.items.filter(
            (item) => !item.adminOnly || isAdmin
          );

          if (visibleItems.length === 0) return null;

          return (
            <div key={groupIdx}>
              <div className="px-3 mb-1.5 text-[10px] font-mono font-bold text-onSurface-muted/70 uppercase tracking-widest">
                {group.title}
              </div>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = item.exact
                    ? (item.href === '/line-oa' ? (pathname === '/line-oa' || pathname === '/line-oa/settings') : pathname === item.href)
                    : pathname === item.href || pathname.startsWith(item.href + '/');

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCloseMobile}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group ${
                        isActive
                          ? 'bg-gradient-to-r from-primary via-[#8c0a0a] to-[#720000] text-white shadow-level1 font-semibold ring-1 ring-primary/20'
                          : 'text-onSurface-variant hover:bg-surface-variant/80 hover:text-onSurface'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 flex-shrink-0 transition-transform duration-150 group-hover:scale-110 ${isActive ? 'text-amber-300' : 'text-primary'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-md font-mono font-bold tracking-wide ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-surface-variant text-onSurface-muted group-hover:bg-primary-container/60 group-hover:text-primary'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom User info */}
      <div className="p-3 border-t border-outline/30 bg-surface/30">
        <div className="flex items-center gap-2.5 p-2 rounded-2xl bg-surface-variant/50 border border-outline/30 hover:border-primary/30 transition-colors">
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-primary-dark text-white flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs ring-1 ring-white/50">
              {user.first_name?.[0] || 'U'}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-onSurface truncate">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-[10px] text-onSurface-muted truncate">
              {user.department_name || 'วิทยาลัยการอาชีพฝาง'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop & Tablet Sidebar (260px desktop) */}
      <aside className="hidden md:block w-64 flex-shrink-0 sticky top-0 h-screen z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-fadeIn">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={onCloseMobile} />
          <div className="relative w-72 max-w-[85vw] h-full shadow-level3 animate-slideRight">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
