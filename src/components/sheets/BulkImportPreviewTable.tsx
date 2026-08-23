import React from 'react';
import { BulkImportPreviewRow } from '@/types/sheets';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface BulkImportPreviewTableProps {
  rows: BulkImportPreviewRow[];
}

export default function BulkImportPreviewTable({ rows }: BulkImportPreviewTableProps) {
  return (
    <div className="rounded-2xl border border-outline/30 bg-surface-card overflow-hidden text-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface-variant/50 border-b border-outline/30 text-onSurface-variant font-heading font-semibold">
            <th className="py-3 px-3 text-center w-12">แถว</th>
            <th className="py-3 px-4">หัวข้อเรื่อง</th>
            <th className="py-3 px-3">ประเภท</th>
            <th className="py-3 px-3">รหัสฝ่าย</th>
            <th className="py-3 px-3 text-center">ผลตรวจสอบ</th>
            <th className="py-3 px-4">หมายเหตุ / ข้อผิดพลาด</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline/15 text-onSurface">
          {rows.map((r) => {
            const isValid = r.validation_status === 'valid';

            return (
              <tr
                key={r.row_no}
                className={`transition-colors ${
                  isValid ? 'hover:bg-surface-variant/30' : 'bg-[#FBE9E7]/40 hover:bg-[#FBE9E7]/60'
                }`}
              >
                <td className="py-2.5 px-3 text-center font-mono font-bold text-onSurface-muted">
                  {r.row_no}
                </td>
                <td className="py-2.5 px-4 font-semibold text-onSurface max-w-xs truncate">
                  {r.data.title || <span className="text-error italic">ไม่มีหัวข้อ</span>}
                </td>
                <td className="py-2.5 px-3 font-mono text-onSurface-muted">
                  {r.data.content_type || '-'}
                </td>
                <td className="py-2.5 px-3 font-mono">
                  {r.data.department_code || '-'}
                </td>
                <td className="py-2.5 px-3 text-center whitespace-nowrap">
                  {isValid ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#E4F2E4] text-[#2E7D32] text-[10px] font-bold">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>ผ่าน</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FBE9E7] text-[#B3261E] text-[10px] font-bold">
                      <AlertCircle className="w-3 h-3" />
                      <span>ไม่ผ่าน</span>
                    </span>
                  )}
                </td>
                <td className="py-2.5 px-4 text-[11px]">
                  {r.errors.length > 0 ? (
                    <span className="text-error font-medium">{r.errors.join(', ')}</span>
                  ) : (
                    <span className="text-onSurface-muted">ข้อมูลถูกต้องพร้อมนำเข้า</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
