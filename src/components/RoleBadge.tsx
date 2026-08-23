import React from 'react';
import { ShieldCheck, UserCheck } from 'lucide-react';

interface RoleBadgeProps {
  role: 'administrator' | 'staff';
}

export default function RoleBadge({ role }: RoleBadgeProps) {
  const isAdmin = role === 'administrator';

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
        isAdmin
          ? 'bg-secondary-container text-secondary-dark border border-secondary/30'
          : 'bg-surface-variant text-onSurface-variant border border-outline/40'
      }`}
    >
      {isAdmin ? (
        <>
          <ShieldCheck className="w-3.5 h-3.5 text-secondary" />
          <span>Administrator</span>
        </>
      ) : (
        <>
          <UserCheck className="w-3.5 h-3.5 text-onSurface-muted" />
          <span>Staff</span>
        </>
      )}
    </span>
  );
}
