'use client';
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
              className={`flex items-center gap-2 px-3.5 h-full text-xs md:text-sm font-semibold transition-all border-b-[3px] ${
                isActive
                  ? 'border-primary text-primary font-bold bg-primary-container/20'
                  : 'border-transparent text-onSurface-muted hover:text-onSurface hover:border-outline/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-onSurface-muted'}`} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
