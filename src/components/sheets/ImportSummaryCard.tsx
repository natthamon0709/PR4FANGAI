import React from 'react';
import { CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface ImportSummaryCardProps {
  total: number;
  validCount: number;
  invalidCount: number;
  importedCount?: number;
}

export default function ImportSummaryCard({
  total,
  validCount,
  invalidCount,
  importedCount,
}: ImportSummaryCardProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <div className="p-4 rounded-xl bg-surface-card border border-outline/30 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-surface-variant flex items-center justify-center font-mono font-bold text-sm text-onSurface">
          {total}
        </div>
        <div>
          <span className="text-xs font-bold text-onSurface block">จำนวนแถวทั้งหมด</span>
          <span className="text-[11px] text-onSurface-muted">จาก Google Sheet</span>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[#E4F2E4]/40 border border-[#2E7D32]/30 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#E4F2E4] text-[#2E7D32] flex items-center justify-center font-mono font-bold text-sm">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs font-bold text-[#2E7D32] block">
            {importedCount !== undefined ? `นำเข้าสำเร็จ ${importedCount}` : `ผ่านการตรวจ ${validCount}`} แถว
          </span>
          <span className="text-[11px] text-onSurface-muted">พร้อมบันทึกลงฐานข้อมูล</span>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[#FBE9E7]/40 border border-[#B3261E]/30 shadow-sm flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#FBE9E7] text-[#B3261E] flex items-center justify-center font-mono font-bold text-sm">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <span className="text-xs font-bold text-[#B3261E] block">
            พบข้อผิดพลาด {invalidCount} แถว
          </span>
          <span className="text-[11px] text-onSurface-muted">แก้ไขใน Sheet แล้วตรวจใหม่</span>
        </div>
      </div>
    </div>
  );
}
