'use client';
import React from 'react';
import { Users, TrendingUp, MessageSquare, LayoutGrid, UserCheck } from 'lucide-react';
import { LineOverviewStats } from '@/types/line';

interface FollowerKpiCardProps {
  stats: LineOverviewStats;
}

export default function FollowerKpiCard({ stats }: FollowerKpiCardProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {/* 1. Total Followers */}
      <div className="p-4 md:p-5 rounded-3xl bg-surface-card border border-outline/30 shadow-level1 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-onSurface-muted font-medium">ผู้ติดตามทั้งหมด</span>
          <div className="w-8 h-8 rounded-xl bg-[#00B900]/10 flex items-center justify-center text-[#00B900]">
            <Users className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl md:text-3xl font-heading font-extrabold text-onSurface">
            {stats.totalFollowers.toLocaleString()}
          </span>
          <span className="text-xs text-onSurface-muted">คน</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-[#2E7D32] font-semibold">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>+{stats.newFollowersThisWeek} สัปดาห์นี้</span>
        </div>
      </div>

      {/* 2. Messages Today */}
      <div className="p-4 md:p-5 rounded-3xl bg-surface-card border border-outline/30 shadow-level1 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-onSurface-muted font-medium">ข้อความสอบถามวันนี้</span>
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <MessageSquare className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl md:text-3xl font-heading font-extrabold text-onSurface">
            {stats.messagesToday.toLocaleString()}
          </span>
          <span className="text-xs text-onSurface-muted">ข้อความ</span>
        </div>
        <div className="text-[11px] text-onSurface-muted font-medium">
          ตอบสำเร็จ <strong className="text-[#2E7D32]">{stats.successRate}%</strong>
        </div>
      </div>

      {/* 3. Active Rich Menu */}
      <div className="p-4 md:p-5 rounded-3xl bg-surface-card border border-outline/30 shadow-level1 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-onSurface-muted font-medium">Rich Menu หลัก</span>
          <div className="w-8 h-8 rounded-xl bg-[#8B6F2E]/10 flex items-center justify-center text-[#8B6F2E]">
            <LayoutGrid className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl md:text-3xl font-heading font-extrabold text-onSurface">
            {stats.activeRichMenuCount}
          </span>
          <span className="text-xs text-onSurface-muted">เมนู</span>
        </div>
        <div className="text-[11px] text-onSurface-muted font-medium">
          เผยแพร่และใช้งานอยู่
        </div>
      </div>

      {/* 4. Linked Staff */}
      <div className="p-4 md:p-5 rounded-3xl bg-surface-card border border-outline/30 shadow-level1 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-onSurface-muted font-medium">เจ้าหน้าที่ที่ผูกบัญชี</span>
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <UserCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl md:text-3xl font-heading font-extrabold text-onSurface">
            {stats.linkedStaffCount}
          </span>
          <span className="text-xs text-onSurface-muted">คน</span>
        </div>
        <div className="text-[11px] text-onSurface-muted font-medium">
          พร้อมรับการแจ้งเตือนงาน
        </div>
      </div>
    </div>
  );
}
