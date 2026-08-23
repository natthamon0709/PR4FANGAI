import React from 'react';
import { Calendar } from 'lucide-react';

interface EffectiveDateRangeProps {
  effectiveDate?: string | null;
  expiryDate?: string | null;
  onEffectiveDateChange: (val: string) => void;
  onExpiryDateChange: (val: string) => void;
  isRequired?: boolean;
}

export default function EffectiveDateRange({
  effectiveDate,
  expiryDate,
  onEffectiveDateChange,
  onExpiryDateChange,
  isRequired = false,
}: EffectiveDateRangeProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-variant/30 border border-outline/30">
      <div>
        <label className="block text-xs font-heading font-semibold text-onSurface mb-1">
          วันที่มีผลบังคับใช้ / เริ่มเผยแพร่ {isRequired && <span className="text-error">*</span>}
        </label>
        <div className="relative flex items-center">
          <Calendar className="w-4 h-4 text-onSurface-muted absolute left-3 pointer-events-none" />
          <input
            type="date"
            value={effectiveDate || ''}
            onChange={(e) => onEffectiveDateChange(e.target.value)}
            required={isRequired}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-outline bg-surface-card text-xs text-onSurface focus:border-primary outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-heading font-semibold text-onSurface mb-1">
          วันที่หมดอายุ / สิ้นสุดผลบังคับใช้ <span className="text-onSurface-muted font-normal">(ถ้ามี)</span>
        </label>
        <div className="relative flex items-center">
          <Calendar className="w-4 h-4 text-onSurface-muted absolute left-3 pointer-events-none" />
          <input
            type="date"
            value={expiryDate || ''}
            onChange={(e) => onExpiryDateChange(e.target.value)}
            min={effectiveDate || undefined}
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-outline bg-surface-card text-xs text-onSurface focus:border-primary outline-none"
          />
        </div>
      </div>
    </div>
  );
}
