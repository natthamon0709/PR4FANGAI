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
          ? 'bg-success-container text-success'
          : 'bg-error-container text-error'
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-success animate-pulse' : 'bg-error'}`} />
      <span>{isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}</span>
    </span>
  );
}
