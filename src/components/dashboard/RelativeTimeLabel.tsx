import React from 'react';
import { Clock } from 'lucide-react';

interface RelativeTimeLabelProps {
  dateString: string;
  showIcon?: boolean;
  className?: string;
}

export function formatThaiRelativeTime(dateString: string): string {
  if (!dateString) return '-';
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now.getTime() - past.getTime();

  if (diffMs < 0 || isNaN(diffMs)) return 'เมื่อสักครู่';

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'เมื่อสักครู่';
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  if (diffHour < 24) return `${diffHour} ชม.ที่แล้ว`;
  if (diffDay === 1) return 'เมื่อวาน';
  if (diffDay < 7) return `${diffDay} วันที่แล้ว`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)} สัปดาห์ที่แล้ว`;

  // Older than 30 days -> short Thai date
  return past.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
  });
}

export default function RelativeTimeLabel({
  dateString,
  showIcon = true,
  className = '',
}: RelativeTimeLabelProps) {
  const formatted = formatThaiRelativeTime(dateString);

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] text-onSurface-muted ${className}`}>
      {showIcon && <Clock className="w-3 h-3 text-onSurface-muted/70 flex-shrink-0" />}
      <span>{formatted}</span>
    </span>
  );
}
