import React from 'react';

interface StatusBadgeProps {
  status: 'active' | 'suspended';
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const isActive = status === 'active';
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses} ${
        isActive
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs'
          : 'bg-rose-50 text-rose-700 border border-rose-200/60 shadow-xs'
      }`}
    >
      {isActive ? (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      ) : (
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
      )}
      <span>{isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</span>
    </span>
  );
}
