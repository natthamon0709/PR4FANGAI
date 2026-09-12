'use client';
import React, { useState } from 'react';
import { DepartmentQueryData } from '@/types/dashboard';
import { BarChart3, Info } from 'lucide-react';

interface DepartmentQueryChartProps {
  data?: DepartmentQueryData[];
}

export default function DepartmentQueryChart({ data = [] }: DepartmentQueryChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 h-80 flex flex-col items-center justify-center text-onSurface-muted">
        <BarChart3 className="w-8 h-8 opacity-30 mb-2" />
        <p className="text-xs">ยังไม่มีข้อมูลสถิติคำถาม</p>
      </div>
    );
  }

  // Find max query count for dynamic scaling
  const actualMax = Math.max(...data.map((d) => d.query_count), 0);
  const maxVal = actualMax > 0 ? Math.ceil(actualMax * 1.25) : 10;
  const midVal2 = Math.round(maxVal * 0.66);
  const midVal1 = Math.round(maxVal * 0.33);

  return (
    <div className="p-5 md:p-6 bg-surface-card rounded-2xl border border-outline/40 shadow-card flex flex-col justify-between h-full">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-outline/30">
        <div>
          <h3 className="font-heading font-bold text-sm md:text-base text-onSurface flex items-center gap-2">
            <span className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
              <BarChart3 className="w-4 h-4" />
            </span>
            <span>ปริมาณคำถาม AI แยกตามฝ่าย (LINE OA)</span>
          </h3>
          <p className="text-[11px] text-onSurface-muted mt-0.5 pl-9">
            สถิติคำถามที่บุคลากรและนักศึกษาสอบถาม AI ในแต่ละฝ่าย
          </p>
        </div>
      </div>

      {/* SVG Bar Chart Visualization */}
      <div className="relative w-full h-52 my-2">
        <svg
          viewBox="0 0 400 160"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          {/* Background Grid Lines */}
          <line x1="40" y1="20" x2="390" y2="20" stroke="#F1F3F5" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="40" y1="60" x2="390" y2="60" stroke="#F1F3F5" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="40" y1="100" x2="390" y2="100" stroke="#F1F3F5" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="40" y1="140" x2="390" y2="140" stroke="#E5E7EB" strokeWidth="1" />

          {/* Dynamic Y Axis Labels */}
          <text x="32" y="24" textAnchor="end" fontSize="9" fill="#7A7670" fontFamily="IBM Plex Mono">{maxVal}</text>
          <text x="32" y="64" textAnchor="end" fontSize="9" fill="#7A7670" fontFamily="IBM Plex Mono">{midVal2}</text>
          <text x="32" y="104" textAnchor="end" fontSize="9" fill="#7A7670" fontFamily="IBM Plex Mono">{midVal1}</text>
          <text x="32" y="144" textAnchor="end" fontSize="9" fill="#7A7670" fontFamily="IBM Plex Mono">0</text>

          {/* Bars */}
          {data.map((item, idx) => {
            const barWidth = 44;
            const gap = (350 - data.length * barWidth) / (data.length + 1);
            const x = 50 + idx * (barWidth + gap);
            const barHeight = Math.max(12, (item.query_count / maxVal) * 115);
            const y = 140 - barHeight;
            const isHovered = hoveredIdx === idx;

            return (
              <g
                key={item.department_id}
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer transition-all duration-200"
              >
                {/* Bar (Modern 6px rounded top) */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="6"
                  ry="6"
                  fill={item.color}
                  opacity={isHovered ? 1 : 0.88}
                  className="transition-all duration-200 hover:brightness-110"
                />

                {/* Query Count on top of bar */}
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="bold"
                  fill={isHovered ? item.color : '#1C1B1A'}
                  fontFamily="IBM Plex Mono"
                >
                  {item.query_count}
                </text>

                {/* X Axis Code label */}
                <text
                  x={x + barWidth / 2}
                  y="155"
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="600"
                  fill="#4A4844"
                  fontFamily="IBM Plex Sans Thai"
                >
                  {item.code}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div className="absolute top-2 right-4 p-3 rounded-xl bg-slate-900/95 backdrop-blur-md text-white text-xs shadow-level3 border border-white/10 z-10 animate-fadeIn pointer-events-none">
            <p className="font-bold text-amber-300">{data[hoveredIdx]?.department_name || ''}</p>
            <p className="text-[11px] text-slate-300 font-mono mt-0.5">
              คำถามทั้งหมด: {data[hoveredIdx]?.query_count || 0} ครั้ง (ตอบได้ {data[hoveredIdx]?.success_rate || 0}%)
            </p>
          </div>
        )}
      </div>

      {/* Bottom Legend */}
      <div className="pt-3 border-t border-outline/30 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        {data.map((item, idx) => (
          <div key={item?.department_id || idx} className="flex items-center gap-1.5 truncate p-1 rounded-lg hover:bg-surface-variant/50 transition-colors">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-xs"
              style={{ backgroundColor: item?.color || '#800000' }}
            />
            <span className="text-onSurface-muted font-medium truncate" title={item?.department_name || ''}>
              {item?.code}: {(item?.department_name || '').replace('ฝ่าย', '')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
