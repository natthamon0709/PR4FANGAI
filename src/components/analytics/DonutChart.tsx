'use client';
import React from 'react';
import { DonutDataPoint } from '@/types/analytics';
import { PieChart } from 'lucide-react';

interface DonutChartProps {
  data: DonutDataPoint[];
  title?: string;
  subtitle?: string;
  centerValue?: string | number;
  centerLabel?: string;
}

export default function DonutChart({
  data = [],
  title = 'สัดส่วนข้อมูล',
  subtitle,
  centerValue,
  centerLabel
}: DonutChartProps) {
  const total = data.reduce((acc, cur) => acc + cur.value, 0);

  // Calculate SVG arc paths (160px diameter, 24px thickness)
  const radius = 68;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="p-5 md:p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 flex flex-col justify-between h-full">
      <div className="pb-3 mb-2 border-b border-outline/20">
        <h3 className="font-heading font-bold text-sm md:text-base text-onSurface flex items-center gap-2">
          <PieChart className="w-4 h-4 text-primary" />
          <span>{title}</span>
        </h3>
        {subtitle && <p className="text-[11px] text-onSurface-muted mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-around gap-4 my-2">
        {/* SVG Donut */}
        <div className="relative w-40 h-40 flex items-center justify-center flex-shrink-0">
          <svg viewBox="0 0 160 160" className="w-full h-full transform -rotate-90">
            <circle cx="80" cy="80" r={radius} fill="transparent" stroke="#f3f4f6" strokeWidth={strokeWidth} />
            {data.map((slice, idx) => {
              const strokeDasharray = `${(slice.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
              accumulatedPercent += slice.percentage;

              return (
                <circle
                  key={idx}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none">
            <span className="font-heading font-black text-xl text-onSurface">
              {centerValue !== undefined ? centerValue : total.toLocaleString()}
            </span>
            {centerLabel && (
              <span className="text-[10px] text-onSurface-muted font-medium">{centerLabel}</span>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 flex-1 min-w-0">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-onSurface truncate">{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0 font-semibold">
                <span className="text-onSurface-muted text-[11px]">({item.value})</span>
                <span className="text-onSurface w-10 text-right">{item.percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
