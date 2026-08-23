'use client';
import React, { useState } from 'react';
import { TrendDataPoint } from '@/types/analytics';
import { TrendingUp } from 'lucide-react';

interface TrendLineChartProps {
  data: TrendDataPoint[];
  title?: string;
  subtitle?: string;
  height?: number;
  color?: string;
  unit?: string;
}

export default function TrendLineChart({
  data = [],
  title = 'แนวโน้มสถิติ',
  subtitle,
  height = 200,
  color = '#800000',
  unit = 'ครั้ง'
}: TrendLineChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 flex flex-col items-center justify-center text-onSurface-muted h-64">
        <TrendingUp className="w-8 h-8 opacity-20 mb-2" />
        <p className="text-xs">ไม่มีข้อมูลแนวโน้มในช่วงเวลานี้</p>
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.value), 10);
  const chartPoints = data.map((d, i) => {
    const x = 40 + i * ((380 - 40) / Math.max(data.length - 1, 1));
    const y = 140 - (d.value / maxVal) * 110;
    return { x, y, data: d };
  });

  const pathD = chartPoints.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  const areaD = chartPoints.length > 1
    ? `${pathD} L ${chartPoints[chartPoints.length - 1].x},140 L ${chartPoints[0].x},140 Z`
    : '';

  return (
    <div className="p-5 md:p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-2 border-b border-outline/20">
        <div>
          <h3 className="font-heading font-bold text-sm md:text-base text-onSurface flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span>{title}</span>
          </h3>
          {subtitle && <p className="text-[11px] text-onSurface-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative w-full h-52 my-1">
        <svg viewBox="0 0 400 160" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="35" y1="30" x2="385" y2="30" stroke="#e5e7eb" strokeDasharray="3 3" />
          <line x1="35" y1="85" x2="385" y2="85" stroke="#e5e7eb" strokeDasharray="3 3" />
          <line x1="35" y1="140" x2="385" y2="140" stroke="#d1d5db" />

          {/* Area */}
          {areaD && <path d={areaD} fill="url(#trendGradient)" />}

          {/* Line */}
          <path d={pathD} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {chartPoints.map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r={hoveredIdx === idx ? 6 : 3.5}
              fill={color}
              stroke="#ffffff"
              strokeWidth="2"
              className="transition-all cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
        </svg>

        {/* Tooltip */}
        {hoveredIdx !== null && chartPoints[hoveredIdx] && (
          <div
            className="absolute z-20 px-2.5 py-1.5 bg-onSurface text-surface text-[11px] rounded-lg shadow-level3 pointer-events-none transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${(chartPoints[hoveredIdx].x / 400) * 100}%`,
              top: `${(chartPoints[hoveredIdx].y / 160) * 100}%`
            }}
          >
            <p className="font-bold">{chartPoints[hoveredIdx].data.label}</p>
            <p className="text-secondary font-semibold">
              {chartPoints[hoveredIdx].data.value.toLocaleString()} {unit}
            </p>
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
