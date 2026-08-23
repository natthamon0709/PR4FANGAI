'use client';
import React from 'react';
import { Thermometer, Info } from 'lucide-react';

interface TemperatureSliderProps {
  value: number; // 0.0 - 1.0
  onChange: (val: number) => void;
  disabled?: boolean;
}

export default function TemperatureSlider({
  value,
  onChange,
  disabled = false
}: TemperatureSliderProps) {
  return (
    <div className="p-4 rounded-2xl bg-surface-card border border-outline/30 shadow-level1 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <label className="text-xs font-bold text-onSurface flex items-center gap-1.5">
            <Thermometer className="w-4 h-4 text-primary" />
            <span>ระดับความสร้างสรรค์ (Temperature)</span>
          </label>
          <p className="text-[11px] text-onSurface-muted mt-0.5">
            0.0 = ตอบตรงตัวตามเอกสารเป๊ะๆ | 1.0 = สำนวนหลากหลายสร้างสรรค์
          </p>
        </div>
        <span className="font-mono font-extrabold text-sm text-primary bg-primary-container/40 px-2.5 py-1 rounded-xl border border-primary/20">
          {value.toFixed(1)}
        </span>
      </div>

      <div className="relative pt-1">
        <input
          type="range"
          min="0.0"
          max="1.0"
          step="0.1"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          disabled={disabled}
          className="w-full h-2 bg-surface-variant rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-50"
        />
        <div className="flex justify-between text-[10px] font-mono text-onSurface-muted mt-1 px-1">
          <span>0.0 (นิ่งตรงเป๊ะ)</span>
          <span className="font-semibold text-primary">0.3 (แนะนำสำหรับงานราชการ)</span>
          <span>1.0 (อิสระสร้างสรรค์)</span>
        </div>
      </div>
    </div>
  );
}
