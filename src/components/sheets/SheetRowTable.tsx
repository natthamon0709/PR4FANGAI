'use client';
import React from 'react';
import { SheetRowItem, SyncStatus } from '@/types/sheets';
import SyncStatusBadge from './SyncStatusBadge';
import { formatThaiRelativeTime } from '@/components/dashboard/RelativeTimeLabel';
import EmptyStateWidget from '@/components/dashboard/EmptyStateWidget';

interface SheetRowTableProps {
  rows: SheetRowItem[];
  sheetName: string;
  onResolveConflict?: (recordId: string) => void;
}

export default function SheetRowTable({
  rows = [],
  sheetName,
  onResolveConflict,
}: SheetRowTableProps) {
  if (rows.length === 0) {
    return (
      <EmptyStateWidget
        title="ไม่พบรายการแถวในแท็บนี้"
        description="ไม่มีแถวที่ตรงกับเงื่อนไขการค้นหาหรือตัวกรองสถานะ"
      />
    );
  }

  return (
    <div className="rounded-2xl border border-outline/30 bg-surface-card overflow-hidden shadow-level1 text-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface-variant/50 border-b border-outline/30 text-onSurface-variant font-heading font-semibold">
            <th className="py-3 px-3 text-center w-14">แถว</th>
            <th className="py-3 px-4">หัวข้อ / รายละเอียด</th>
            <th className="py-3 px-3">ฝ่าย / หน่วยงาน</th>
            <th className="py-3 px-3 text-center">สถานะซิงค์</th>
            <th className="py-3 px-3 text-right">แก้ไขล่าสุด</th>
            <th className="py-3 px-3 text-center w-24">การทำงาน</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline/15 text-onSurface">
          {rows.map((row) => (
            <tr key={row.record_id || row.row_no} className="hover:bg-surface-variant/20 transition-colors">
              <td className="py-3 px-3 text-center font-mono font-bold text-onSurface-muted">
                {row.row_no}
              </td>

              <td className="py-3 px-4 max-w-sm">
                <div className="font-bold text-onSurface line-clamp-1">{row.title}</div>
                {row.summary && (
                  <p className="text-[11px] text-onSurface-muted line-clamp-1 mt-0.5">{row.summary}</p>
                )}
                {row.error_details && (
                  <p className="text-[10px] text-error font-medium mt-0.5">⚠️ {row.error_details}</p>
                )}
              </td>

              <td className="py-3 px-3 whitespace-nowrap text-onSurface-muted">
                {row.department_name || '-'}
              </td>

              <td className="py-3 px-3 text-center whitespace-nowrap">
                <SyncStatusBadge status={row.status} />
              </td>

              <td className="py-3 px-3 text-right whitespace-nowrap text-onSurface-muted text-[11px]">
                <div>{formatThaiRelativeTime(row.last_modified_at)}</div>
                <div className="text-[10px] text-onSurface-muted/70">{row.last_modified_by}</div>
              </td>

              <td className="py-3 px-3 text-center whitespace-nowrap">
                {row.status === 'conflict' && onResolveConflict && (
                  <button
                    type="button"
                    onClick={() => onResolveConflict(row.record_id)}
                    className="px-2.5 py-1 rounded-lg bg-[#6750A4] text-white text-[11px] font-bold shadow-sm hover:bg-[#533E85] transition-colors"
                  >
                    แก้ไข
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
