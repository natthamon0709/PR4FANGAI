import React from 'react';
import Link from 'next/link';
import { FolderOpen, Plus } from 'lucide-react';

interface EmptyStateWidgetProps {
  title?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export default function EmptyStateWidget({
  title = 'ยังไม่มีข้อมูลในส่วนนี้',
  description = 'เริ่มต้นสร้างและบันทึกข้อมูลเพื่อแสดงผลในหน้าแดชบอร์ด',
  actionText,
  actionHref,
  onAction,
  icon,
}: EmptyStateWidgetProps) {
  return (
    <div className="p-8 text-center bg-surface-variant/30 rounded-xl border border-dashed border-outline/50 space-y-3">
      <div className="w-10 h-10 rounded-full bg-surface-variant text-onSurface-muted flex items-center justify-center mx-auto">
        {icon || <FolderOpen className="w-5 h-5 text-onSurface-muted" />}
      </div>
      <div>
        <h4 className="text-sm font-heading font-bold text-onSurface">{title}</h4>
        <p className="text-xs text-onSurface-muted mt-0.5 max-w-sm mx-auto">{description}</p>
      </div>

      {actionText && actionHref && (
        <div className="pt-1">
          <Link
            href={actionHref}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{actionText}</span>
          </Link>
        </div>
      )}

      {actionText && onAction && !actionHref && (
        <div className="pt-1">
          <button
            onClick={onAction}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-semibold shadow-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{actionText}</span>
          </button>
        </div>
      )}
    </div>
  );
}
