'use client';
import React from 'react';
import Link from 'next/link';
import { Send, Users, Clock, CheckCircle2, AlertTriangle, Plus } from 'lucide-react';
import { LineBroadcast } from '@/types/line';

interface BroadcastHistoryListProps {
  broadcasts: LineBroadcast[];
  showCreateButton?: boolean;
}

export default function BroadcastHistoryList({
  broadcasts,
  showCreateButton = true
}: BroadcastHistoryListProps) {
  if (broadcasts.length === 0) {
    return (
      <div className="p-8 rounded-3xl bg-surface-card border border-outline/30 text-center space-y-3">
        <Send className="w-8 h-8 mx-auto text-onSurface-muted/60" />
        <p className="text-xs text-onSurface-muted">ยังไม่มีประวัติการส่งข้อความประชาสัมพันธ์ Broadcast</p>
        {showCreateButton && (
          <Link
            href="/line-oa/broadcast"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-onPrimary text-xs font-semibold hover:bg-primary-hover transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>สร้างข้อความประชาสัมพันธ์แรก</span>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {broadcasts.map((bc) => {
        const isSent = bc.status === 'sent';
        return (
          <div
            key={bc.broadcast_id}
            className="p-4 rounded-2xl bg-surface-card border border-outline/30 hover:border-outline/60 shadow-level1 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono ${
                    isSent
                      ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/20'
                      : 'bg-[#FFF8E1] text-[#8B6F2E] border border-[#8B6F2E]/20'
                  }`}
                >
                  {isSent ? 'ส่งแล้ว' : 'ตั้งเวลาล่วงหน้า'}
                </span>
                <h4 className="text-xs md:text-sm font-heading font-bold text-onSurface truncate">
                  {bc.title}
                </h4>
              </div>
              <p className="text-xs text-onSurface-muted line-clamp-1">
                {bc.message_text}
              </p>
            </div>

            <div className="flex items-center gap-4 flex-shrink-0 text-xs text-onSurface-muted font-mono">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-[#00B900]" />
                <strong className="text-onSurface">{bc.delivered_count.toLocaleString()}</strong> คน
              </span>

              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(bc.sent_at || bc.created_at).toLocaleDateString('th-TH')}</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
