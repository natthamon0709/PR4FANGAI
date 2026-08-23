'use client';
import React from 'react';
import { Layers, Plus, Minus } from 'lucide-react';

interface TopKStepperProps {
  value: number; // 1 - 10
  onChange: (val: number) => void;
  disabled?: boolean;
}

export default function TopKStepper({
  value,
  onChange,
  disabled = false
}: TopKStepperProps) {
  const handleDecrement = () => {
    if (value > 1) onChange(value - 1);
  };

  const handleIncrement = () => {
    if (value < 10) onChange(value + 1);
  };

  return (
    <div className="p-4 rounded-2xl bg-surface-card border border-outline/30 shadow-level1 flex items-center justify-between gap-4">
      <div>
        <label className="text-xs font-bold text-onSurface flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-primary" />
          <span>จำนวนแหล่งอ้างอิงสูงสุด (Retrieval Top-K)</span>
        </label>
        <p className="text-[11px] text-onSurface-muted mt-0.5">
          จำนวนองค์ความรู้ที่ค้นพบและส่งต่อให้ AI ใช้อ้างอิงสังเคราะห์คำตอบ (1–10 รายการ)
        </p>
      </div>

      <div className="flex items-center gap-2 bg-surface-variant/40 p-1.5 rounded-2xl border border-outline/20">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={disabled || value <= 1}
          className="w-8 h-8 rounded-xl bg-surface hover:bg-surface-card text-onSurface border border-outline/30 flex items-center justify-center disabled:opacity-40 shadow-sm transition-all"
          title="ลดจำนวน"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <span className="font-mono font-extrabold text-sm text-primary w-8 text-center">
          {value}
        </span>

        <button
          type="button"
          onClick={handleIncrement}
          disabled={disabled || value >= 10}
          className="w-8 h-8 rounded-xl bg-surface hover:bg-surface-card text-onSurface border border-outline/30 flex items-center justify-center disabled:opacity-40 shadow-sm transition-all"
          title="เพิ่มจำนวน"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
