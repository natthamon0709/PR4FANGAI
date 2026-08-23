'use client';
import React, { useState } from 'react';
import { DateRangePreset } from '@/types/analytics';
import { Calendar, ChevronDown, Check } from 'lucide-react';

interface DateRangePickerProps {
  preset: DateRangePreset;
  startDate?: string;
  endDate?: string;
  onRangeChange: (preset: DateRangePreset, startDate?: string, endDate?: string) => void;
}

export default function DateRangePicker({
  preset,
  startDate,
  endDate,
  onRangeChange
}: DateRangePickerProps) {
  const [isOpenCustom, setIsOpenCustom] = useState(false);
  const [customStart, setCustomStart] = useState(startDate || '');
  const [customEnd, setCustomEnd] = useState(endDate || '');

  const presets: { id: DateRangePreset; label: string }[] = [
    { id: '7d', label: '7 วัน' },
    { id: '30d', label: '30 วัน' },
    { id: '90d', label: '90 วัน' },
    { id: '1y', label: '1 ปี' },
    { id: 'custom', label: 'กำหนดเอง' }
  ];

  const handleApplyCustom = () => {
    if (customStart && customEnd) {
      onRangeChange('custom', customStart, customEnd);
      setIsOpenCustom(false);
    }
  };

  return (
    <div className="relative flex items-center">
      {/* Pill group */}
      <div className="inline-flex p-1 bg-surface-card rounded-full border border-outline/30 shadow-sm">
        {presets.map((p) => {
          const isActive = preset === p.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                if (p.id === 'custom') {
                  setIsOpenCustom(true);
                } else {
                  setIsOpenCustom(false);
                  onRangeChange(p.id);
                }
              }}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-onSurface-muted hover:text-onSurface hover:bg-outline/10'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Custom Popover Modal */}
      {isOpenCustom && (
        <div className="absolute right-0 top-12 z-50 p-4 bg-surface-card rounded-2xl border border-outline/40 shadow-level2 w-72 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-outline/20">
            <h4 className="text-xs font-bold text-onSurface flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>เลือกช่วงเวลาแบบกำหนดเอง</span>
            </h4>
          </div>
          <div className="space-y-2">
            <div>
              <label className="text-[11px] font-medium text-onSurface-muted block mb-1">วันที่เริ่มต้น</label>
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-surface border border-outline/30 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-[11px] font-medium text-onSurface-muted block mb-1">วันที่สิ้นสุด</label>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-surface border border-outline/30 rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-outline/20">
            <button
              onClick={() => setIsOpenCustom(false)}
              className="px-2.5 py-1 text-xs text-onSurface-muted hover:text-onSurface"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleApplyCustom}
              disabled={!customStart || !customEnd}
              className="px-3 py-1 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary-dark disabled:opacity-50 flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>ใช้งาน</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
