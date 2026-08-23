'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, BookOpen, Bot, Smartphone, FileSpreadsheet, Clock } from 'lucide-react';

interface AnalyticsTabNavProps {
  isAdmin?: boolean;
}

export default function AnalyticsTabNav({ isAdmin = true }: AnalyticsTabNavProps) {
  const pathname = usePathname();

  const tabs = [
    { label: 'ภาพรวม (Overview)', href: '/analytics', icon: LayoutDashboard, exact: true },
    { label: 'การใช้งานระบบ (Usage)', href: '/analytics/usage', icon: Users },
    { label: 'ประสิทธิภาพองค์ความรู้', href: '/analytics/knowledge', icon: BookOpen },
    { label: 'ประสิทธิภาพ AI (RAG)', href: '/analytics/ai-performance', icon: Bot },
    { label: 'LINE Official Account', href: '/analytics/line', icon: Smartphone },
    { label: 'ส่งออกรายงาน (Export)', href: '/analytics/export', icon: FileSpreadsheet },
    ...(isAdmin ? [{ label: 'ตั้งเวลาส่งอัตโนมัติ', href: '/analytics/scheduled-reports', icon: Clock, adminOnly: true }] : []),
  ];

  return (
    <div className="border-b border-outline/20 bg-surface-card rounded-xl px-2 mb-6 shadow-sm overflow-x-auto">
      <nav className="flex space-x-1 sm:space-x-2 h-11 min-w-max">
        {tabs.map((tab) => {
          const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
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
              {tab.adminOnly && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-secondary/15 text-secondary-dark font-bold">
                  Admin
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
