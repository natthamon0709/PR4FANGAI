import React from 'react';
import { KnowledgeStatus } from '@/types/knowledge';
import { CheckCircle2, FileEdit, Archive } from 'lucide-react';

interface KnowledgeStatusBadgeProps {
  status: KnowledgeStatus;
  className?: string;
}

export default function KnowledgeStatusBadge({ status, className = '' }: KnowledgeStatusBadgeProps) {
  switch (status) {
    case 'published':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-success-container text-success text-[11px] font-bold border border-success/30 ${className}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span>เผยแพร่</span>
        </span>
      );
    case 'draft':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-surface-variant text-onSurface-muted text-[11px] font-medium border border-outline/30 ${className}`}>
          <FileEdit className="w-3 h-3" />
          <span>แบบร่าง</span>
        </span>
      );
    case 'archived':
      return (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-error-container text-error text-[11px] font-bold border border-error/30 ${className}`}>
          <Archive className="w-3 h-3" />
          <span>เก็บถาวร</span>
        </span>
      );
    default:
      return null;
  }
}
