'use client';
import React from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface LineConnectionStatusBadgeProps {
  connected?: boolean;
  channelId?: string;
  botName?: string | null;
  basicId?: string | null;
  size?: 'sm' | 'md';
}

export default function LineConnectionStatusBadge({
  connected = false,
  channelId,
  botName,
  basicId,
  size = 'md'
}: LineConnectionStatusBadgeProps) {
  if (connected) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${
          size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
        } bg-[#00B900]/10 text-[#00B900] border-[#00B900]/30 shadow-sm`}
      >
        <span className="w-2 h-2 rounded-full bg-[#00B900] animate-pulse" />
        <span>เชื่อมต่อ LINE OA สำเร็จ{botName ? `: ${botName}` : ''}</span>
        {basicId && <span className="font-mono text-[10px] opacity-90 font-bold">(@{basicId.replace('@', '')})</span>}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs'
      } bg-[#FBE9E7] text-[#B3261E] border-[#B3261E]/30`}
    >
      <AlertCircle className="w-3.5 h-3.5" />
      <span>ยังไม่ได้เชื่อมต่อ LINE OA</span>
    </span>
  );
}
