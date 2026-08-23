'use client';
import React, { useState } from 'react';
import { StackedBarDataPoint } from '@/types/analytics';
import { BarChart3 } from 'lucide-react';

interface StackedBarChartProps {
  data: StackedBarDataPoint[];
  title?: string;
  subtitle?: string;
}

export default function StackedBarChart({
  data = [],
  title = 'ระดับความมั่นใจ AI รายวัน',
  subtitle
}: StackedBarChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 flex flex-col items-center justify-center text-onSurface-muted h-64">
        <BarChart3 className="w-8 h-8 opacity-20 mb-2" />
        <p className="text-xs">ไม่มีข้อมูลสถิติ</p>
      </div>
    );
  }

  const maxTotal = Math.max(...data.map(d => d.total), 10);

  return (
    <div className="p-5 md:p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-2 border-b border-outline/20">
        <div>
          <h3 className="font-heading font-bold text-sm md:text-base text-onSurface flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span>{title}</span>
          </h3>
          {subtitle && <p className="text-[11px] text-onSurface-muted mt-0.5">{subtitle}</p>}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#059669]"></span>
            <span>สูง (≥0.85)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#2563EB]"></span>
            <span>กลาง (0.70-0.84)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#D97706]"></span>
            <span>ต่ำ (&lt;0.70)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#DC2626]"></span>
            <span>Fallback</span>
          </span>
        </div>
      </div>

      {/* Bars */}
      <div className="relative w-full h-52 my-1">
        <svg viewBox="0 0 400 160" className="w-full h-full overflow-visible">
          {/* Grid lines */}
          <line x1="30" y1="30" x2="390" y2="30" stroke="#e5e7eb" strokeDasharray="3 3" />
          <line x1="30" y1="85" x2="390" y2="85" stroke="#e5e7eb" strokeDasharray="3 3" />
          <line x1="30" y1="140" x2="390" y2="140" stroke="#d1d5db" />

          {data.map((d, idx) => {
            const barW = Math.min(22, Math.max(8, 340 / data.length - 4));
            const x = 40 + idx * (340 / Math.max(data.length, 1));
            const totalH = (d.total / maxTotal) * 110;

            const highH = d.total > 0 ? (d.high / d.total) * totalH : 0;
            const medH = d.total > 0 ? (d.medium / d.total) * totalH : 0;
            const lowH = d.total > 0 ? (d.low / d.total) * totalH : 0;
            const fbH = d.total > 0 ? (d.fallback / d.total) * totalH : 0;

            let curY = 140;

            return (
              <g
                key={idx}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                {/* Fallback */}
                {fbH > 0 && (
                  <rect x={x} y={curY - fbH} width={barW} height={fbH} fill="#DC2626" rx="1" />
                )}
                {/* Low */}
                {lowH > 0 && (
                  <rect x={x} y={(curY -= fbH) - lowH} width={barW} height={lowH} fill="#D97706" rx="1" />
                )}
                {/* Med */}
                {medH > 0 && (
                  <rect x={x} y={(curY -= lowH) - medH} width={barW} height={medH} fill="#2563EB" rx="1" />
                )}
                {/* High */}
                {highH > 0 && (
                  <rect x={x} y={(curY -= medH) - highH} width={barW} height={highH} fill="#059669" rx="1" />
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div className="absolute top-2 right-2 p-2.5 bg-onSurface text-surface rounded-xl shadow-level3 text-xs space-y-1">
            <p className="font-bold border-b border-outline/30 pb-1">{data[hoveredIdx].label} ({data[hoveredIdx].total} คำถาม)</p>
            <p className="text-emerald-400">สูง: {data[hoveredIdx].high} ครั้ง</p>
            <p className="text-blue-400">กลาง: {data[hoveredIdx].medium} ครั้ง</p>
            <p className="text-amber-400">ต่ำ: {data[hoveredIdx].low} ครั้ง</p>
            <p className="text-rose-400">Fallback: {data[hoveredIdx].fallback} ครั้ง</p>
          </div>
        )}
      </div>

      {/* Axis Labels */}
      <div className="flex justify-between text-[10px] text-onSurface-muted pt-2 border-t border-outline/15">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </div>
  );
}
