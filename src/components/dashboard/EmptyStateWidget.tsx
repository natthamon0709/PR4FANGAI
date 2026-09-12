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
    <div className="p-8 text-center bg-surface-variant/20 rounded-2xl border border-dashed border-outline/60 space-y-3.5">
      <div className="w-12 h-12 rounded-2xl bg-surface-variant/80 text-onSurface-muted flex items-center justify-center mx-auto shadow-xs">
        {icon || <FolderOpen className="w-6 h-6 text-onSurface-muted/80" />}
      </div>
      <div>
        <h4 className="text-sm font-heading font-bold text-onSurface">{title}</h4>
        <p className="text-xs text-onSurface-muted mt-1 max-w-sm mx-auto leading-relaxed">{description}</p>
      </div>

      {actionText && actionHref && (
        <div className="pt-1">
          <Link
            href={actionHref}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark hover:from-[#961212] hover:to-[#800000] text-white text-xs font-semibold shadow-xs hover:shadow-card transition-all active:scale-95"
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
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-primary-dark hover:from-[#961212] hover:to-[#800000] text-white text-xs font-semibold shadow-xs hover:shadow-card transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{actionText}</span>
          </button>
        </div>
      )}
    </div>
  );
}
