import React from 'react';
import { ShieldCheck, UserCheck } from 'lucide-react';

interface RoleBadgeProps {
  role: 'administrator' | 'staff';
}

export default function RoleBadge({ role }: RoleBadgeProps) {
  const isAdmin = role === 'administrator';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors ${
        isAdmin
          ? 'bg-amber-500/10 text-amber-700 border border-amber-500/30 shadow-xs font-mono font-bold'
          : 'bg-surface-variant text-onSurface-variant border border-outline/50'
      }`}
    >
      {isAdmin ? (
        <>
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
          <span>Administrator</span>
        </>
      ) : (
        <>
          <UserCheck className="w-3.5 h-3.5 text-onSurface-muted/80" />
          <span>Staff</span>
        </>
      )}
    </span>
  );
}
