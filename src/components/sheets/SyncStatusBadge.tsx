import React from 'react';
import { SyncStatus } from '@/types/sheets';
import { CheckCircle2, Clock, AlertCircle, AlertTriangle } from 'lucide-react';

interface SyncStatusBadgeProps {
  status: SyncStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export default function SyncStatusBadge({
  status,
  size = 'sm',
  className = '',
}: SyncStatusBadgeProps) {
  const isSm = size === 'sm';
  const sizeClasses = isSm ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs';

  switch (status) {
    case 'success':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-[#E4F2E4] text-[#2E7D32] border border-[#2E7D32]/25 ${sizeClasses} ${className}`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
          <span>ซิงค์แล้ว</span>
        </span>
      );
    case 'pending':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-[#FFF4CE] text-[#8B6F2E] border border-[#8B6F2E]/25 ${sizeClasses} ${className}`}
        >
          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>รอซิงค์</span>
        </span>
      );
    case 'error':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-[#FBE9E7] text-[#B3261E] border border-[#B3261E]/25 ${sizeClasses} ${className}`}
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>ผิดพลาด</span>
        </span>
      );
    case 'conflict':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-[#EDE7F6] text-[#6750A4] border border-[#6750A4]/25 ${sizeClasses} ${className}`}
        >
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>ขัดแย้ง</span>
        </span>
      );
    default:
      return null;
  }
}
