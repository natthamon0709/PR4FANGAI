'use client';
import React from 'react';
import { FileText, FileSpreadsheet } from 'lucide-react';

interface ExportFormatSelectorProps {
  format: 'pdf' | 'xlsx';
  onChange: (format: 'pdf' | 'xlsx') => void;
}

export default function ExportFormatSelector({ format, onChange }: ExportFormatSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div
        onClick={() => onChange('pdf')}
        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
          format === 'pdf'
            ? 'border-primary bg-primary-container/20 text-primary font-bold'
            : 'border-outline/30 bg-surface-card hover:border-outline/60 text-onSurface-muted'
        }`}
      >
        <FileText className="w-5 h-5 flex-shrink-0" />
        <div>
          <p className="text-xs md:text-sm text-onSurface">PDF (ทางการพร้อมพิมพ์)</p>
          <p className="text-[11px] text-onSurface-muted font-normal">เอกสาร A4 มีตราวิทยาลัย</p>
        </div>
      </div>

      <div
        onClick={() => onChange('xlsx')}
        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 ${
          format === 'xlsx'
            ? 'border-primary bg-primary-container/20 text-primary font-bold'
            : 'border-outline/30 bg-surface-card hover:border-outline/60 text-onSurface-muted'
        }`}
      >
        <FileSpreadsheet className="w-5 h-5 flex-shrink-0" />
        <div>
          <p className="text-xs md:text-sm text-onSurface">Excel / CSV (วิเคราะห์ต่อ)</p>
          <p className="text-[11px] text-onSurface-muted font-normal">ไฟล์ตาราง UTF-8 สำหรับ Excel</p>
        </div>
      </div>
    </div>
  );
}
