'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { KnowledgeItem } from '@/types/knowledge';
import ContentTypeBadge from './ContentTypeBadge';
import KnowledgeStatusBadge from './KnowledgeStatusBadge';
import { formatThaiRelativeTime } from '@/components/dashboard/RelativeTimeLabel';
import EmptyStateWidget from '@/components/dashboard/EmptyStateWidget';
import { 
  Eye, 
  Edit3, 
  Archive, 
  History, 
  MoreVertical, 
  Bot, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Trash2
} from 'lucide-react';

interface KnowledgeTableProps {
  items: KnowledgeItem[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  onArchiveToggle: (item: KnowledgeItem) => void;
  onDelete?: (item: KnowledgeItem) => void;
  currentUserId?: string;
  currentUserDeptId?: string;
  isAdmin?: boolean;
}

export default function KnowledgeTable({
  items = [],
  total,
  page,
  totalPages,
  onPageChange,
  onArchiveToggle,
  onDelete,
  currentUserId,
  currentUserDeptId,
  isAdmin = false,
}: KnowledgeTableProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <EmptyStateWidget
        title="ไม่พบองค์ความรู้ที่ตรงกับเงื่อนไข"
        description="ลองเปลี่ยนคำค้นหา หรือเลือกตัวกรองประเภทข้อมูลอื่น"
        actionText="+ เพิ่มองค์ความรู้ใหม่"
        actionHref="/knowledge/new"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop Table View */}
      <div className="hidden md:block bg-surface-card rounded-2xl border border-outline/30 shadow-level1 overflow-hidden">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-surface-variant/50 border-b border-outline/30 text-onSurface-variant font-heading font-semibold">
              <th className="py-3.5 px-4">หัวข้อเรื่อง</th>
              <th className="py-3.5 px-3">ประเภท</th>
              <th className="py-3.5 px-3">ฝ่าย / งาน</th>
              <th className="py-3.5 px-3">สถานะ</th>
              <th className="py-3.5 px-3 text-center">AI Ref</th>
              <th className="py-3.5 px-3 text-right">อัปเดตล่าสุด</th>
              <th className="py-3.5 px-4 text-center">การทำงาน</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline/15 text-onSurface">
            {items.map((item) => {
              const canManage = isAdmin || item.department_id === currentUserDeptId;

              return (
                <tr
                  key={item.knowledge_id}
                  className="hover:bg-surface-variant/30 transition-colors group"
                >
                  {/* Title & Summary */}
                  <td className="py-3 px-4 max-w-sm">
                    <Link
                      href={`/knowledge/${item.knowledge_id}`}
                      className="font-bold text-xs md:text-sm text-onSurface hover:text-primary hover:underline line-clamp-1 block"
                      title={item.title}
                    >
                      {item.title}
                    </Link>
                    <p className="text-[11px] text-onSurface-muted line-clamp-1 mt-0.5">
                      {item.summary}
                    </p>
                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.tags.slice(0, 3).map((t, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.2 rounded bg-surface-variant text-[10px] text-onSurface-muted"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Type Badge */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <ContentTypeBadge type={item.content_type} />
                  </td>

                  {/* Department */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="text-xs font-medium text-onSurface truncate max-w-[130px]" title={item.department_name}>
                      {item.department_name ? item.department_name.replace('ฝ่าย', '') : '-'}
                    </div>
                    <div className="text-[10px] text-onSurface-muted truncate max-w-[130px]" title={item.sub_department_name}>
                      {item.sub_department_name || '-'}
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <KnowledgeStatusBadge status={item.status} />
                  </td>

                  {/* AI Ref Count */}
                  <td className="py-3 px-3 text-center whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary-container text-primary font-mono text-[11px] font-bold">
                      <Bot className="w-3 h-3" />
                      <span>{item.ai_reference_count || 0}</span>
                    </span>
                  </td>

                  {/* Updated At */}
                  <td className="py-3 px-3 text-right whitespace-nowrap text-onSurface-muted text-[11px]">
                    <div>{formatThaiRelativeTime(item.updated_at)}</div>
                    <div className="text-[10px] text-onSurface-muted/70">{item.updater_name || item.creator_name}</div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <div className="flex items-center justify-center gap-1">
                      <Link
                        href={`/knowledge/${item.knowledge_id}`}
                        className="p-1.5 rounded-lg text-onSurface-muted hover:text-primary hover:bg-surface-variant transition-colors"
                        title="ดูรายละเอียด"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>

                      {canManage && (
                        <>
                          <Link
                            href={`/knowledge/${item.knowledge_id}/edit`}
                            className="p-1.5 rounded-lg text-onSurface-muted hover:text-secondary-dark hover:bg-surface-variant transition-colors"
                            title="แก้ไข"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>

                          <Link
                            href={`/knowledge/${item.knowledge_id}/history`}
                            className="p-1.5 rounded-lg text-onSurface-muted hover:text-primary hover:bg-surface-variant transition-colors"
                            title="ประวัติเวอร์ชัน"
                          >
                            <History className="w-4 h-4" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => onArchiveToggle(item)}
                            className="p-1.5 rounded-lg text-onSurface-muted hover:text-error hover:bg-error-container/30 transition-colors"
                            title={item.status === 'archived' ? 'เผยแพร่อีกครั้ง' : 'เก็บถาวร'}
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List */}
      <div className="md:hidden space-y-3">
        {items.map((item) => {
          const canManage = isAdmin || item.department_id === currentUserDeptId;

          return (
            <div
              key={item.knowledge_id}
              className="p-4 rounded-2xl bg-surface-card border border-outline/30 shadow-level1 space-y-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <ContentTypeBadge type={item.content_type} />
                <KnowledgeStatusBadge status={item.status} />
              </div>

              <div>
                <Link
                  href={`/knowledge/${item.knowledge_id}`}
                  className="font-heading font-bold text-sm text-onSurface hover:text-primary leading-snug block"
                >
                  {item.title}
                </Link>
                <p className="text-xs text-onSurface-muted line-clamp-2 mt-1">
                  {item.summary}
                </p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-onSurface-muted pt-2 border-t border-outline/15">
                <span>{item.department_name ? item.department_name.replace('ฝ่าย', '') : '-'}</span>
                <span>อัปเดต: {formatThaiRelativeTime(item.updated_at)}</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline/15">
                <Link
                  href={`/knowledge/${item.knowledge_id}`}
                  className="px-3 py-1 rounded-lg bg-surface-variant text-onSurface text-xs font-semibold"
                >
                  ดูรายละเอียด
                </Link>
                {canManage && (
                  <Link
                    href={`/knowledge/${item.knowledge_id}/edit`}
                    className="px-3 py-1 rounded-lg bg-primary text-white text-xs font-semibold"
                  >
                    แก้ไข
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-onSurface-muted">
        <div>
          แสดง {items.length > 0 ? (page - 1) * 10 + 1 : 0} ถึง {Math.min(page * 10, total)} จากทั้งหมด {total} รายการ
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1 self-center">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-outline hover:bg-surface-variant disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`w-8 h-8 rounded-lg text-xs font-bold font-mono transition-all ${
                  page === p
                    ? 'bg-primary text-white shadow-sm'
                    : 'border border-outline hover:bg-surface-variant text-onSurface'
                }`}
              >
                {p}
              </button>
            ))}

            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-outline hover:bg-surface-variant disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
