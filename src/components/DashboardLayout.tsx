'use client';
import React, { useState } from 'react';
import SidebarNav from './SidebarNav';
import TopNavbar from './TopNavbar';
import FooterBar from './FooterBar';
import { SessionUser } from '@/types';

interface DashboardLayoutProps {
  user: SessionUser;
  breadcrumbs?: { label: string; href?: string }[];
  children: React.ReactNode;
}

export default function DashboardLayout({
  user,
  breadcrumbs = [],
  children,
}: DashboardLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-surface text-onSurface">
      {/* Sidebar */}
      <SidebarNav
        user={user}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopNavbar
          user={user}
          breadcrumbs={breadcrumbs}
          onToggleSidebarMobile={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        <FooterBar />
      </div>
    </div>
  );
}
