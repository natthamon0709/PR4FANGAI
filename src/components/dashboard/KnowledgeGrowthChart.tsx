'use client';
import React, { useState } from 'react';
import { KnowledgeGrowthData } from '@/types/dashboard';
import { TrendingUp } from 'lucide-react';

interface KnowledgeGrowthChartProps {
  data?: KnowledgeGrowthData[];
}

export default function KnowledgeGrowthChart({ data = [] }: KnowledgeGrowthChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 h-80 flex flex-col items-center justify-center text-onSurface-muted">
        <TrendingUp className="w-8 h-8 opacity-30 mb-2" />
        <p className="text-xs">ยังไม่มีข้อมูลแนวโน้มองค์ความรู้</p>
      </div>
    );
  }

  const maxVal = Math.max(...data.map((d) => d.total_count), 25);
  const midVal2 = Math.round(maxVal * 0.66);
  const midVal1 = Math.round(maxVal * 0.33);

  // SVG Coordinates calculation (400 x 160)
  const chartPoints = data.map((d, i) => {
    const x = 50 + i * ((380 - 50) / (data.length - 1));
    const y = 140 - (d.total_count / maxVal) * 110;
    return { x, y, data: d };
  });

  const pathD = chartPoints.reduce((acc, pt, i) => {
    return i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${chartPoints[chartPoints.length - 1].x},140 L ${chartPoints[0].x},140 Z`;

  const latestTotal = data[data.length - 1]?.total_count || 0;
  const avgGrowth = data.length > 0 ? Math.round(data.reduce((acc, curr) => acc + (curr.new_items || 0), 0) / data.length) : 0;

  return (
    <div className="p-5 md:p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 flex flex-col justify-between h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4 pb-2 border-b border-outline/20">
        <div>
          <h3 className="font-heading font-bold text-sm md:text-base text-onSurface flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span>แนวโน้มองค์ความรู้สะสม (Knowledge Growth)</span>
          </h3>
          <p className="text-[11px] text-onSurface-muted mt-0.5">
            อัตราการเพิ่มขึ้นขององค์ความรู้ 6 เดือนล่าสุด
          </p>
        </div>
      </div>

      {/* SVG Line Chart */}
      <div className="relative w-full h-52 my-2">
        <svg
          viewBox="0 0 400 160"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="primaryAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#800000" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#800000" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="45" y1="25" x2="385" y2="25" stroke="#F6ECEC" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="45" y1="65" x2="385" y2="65" stroke="#F6ECEC" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="45" y1="105" x2="385" y2="105" stroke="#F6ECEC" strokeWidth="1" strokeDasharray="3 3" />
          <line x1="45" y1="140" x2="385" y2="140" stroke="#E2D5D5" strokeWidth="1" />

          {/* Dynamic Y Axis Labels */}
          <text x="38" y="28" textAnchor="end" fontSize="9" fill="#7A7670" fontFamily="IBM Plex Mono">{maxVal}</text>
          <text x="38" y="68" textAnchor="end" fontSize="9" fill="#7A7670" fontFamily="IBM Plex Mono">{midVal2}</text>
          <text x="38" y="108" textAnchor="end" fontSize="9" fill="#7A7670" fontFamily="IBM Plex Mono">{midVal1}</text>
          <text x="38" y="144" textAnchor="end" fontSize="9" fill="#7A7670" fontFamily="IBM Plex Mono">0</text>

          {/* Filled Area Gradient */}
          <path d={areaD} fill="url(#primaryAreaGrad)" />

          {/* Solid Curve Line (Style Guide: 2.5px width) */}
          <path d={pathD} fill="none" stroke="#800000" strokeWidth="2.5" strokeLinecap="round" />

          {/* Data Points (Style Guide: 6px circle with hover highlight) */}
          {chartPoints.map((pt, i) => {
            const isHovered = hoveredIdx === i;
            return (
              <g
                key={i}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? "6" : "4"}
                  fill={isHovered ? "#D97706" : "#800000"}
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="transition-all duration-150"
                />

                {/* X Axis month label */}
                <text
                  x={pt.x}
                  y="155"
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight="500"
                  fill="#4A4844"
                  fontFamily="IBM Plex Sans Thai"
                >
                  {pt.data.month}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredIdx !== null && data[hoveredIdx] && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 p-2.5 rounded-lg bg-[#1C1B1A] text-white text-xs shadow-level3 border border-outline/20 z-10 animate-fadeIn pointer-events-none">
            <p className="font-bold text-secondary-light">เดือน {data[hoveredIdx].month}</p>
            <p className="text-[11px] text-white/90 font-mono mt-0.5">
              สะสม: {data[hoveredIdx].total_count} รายการ (+{data[hoveredIdx].new_items} ใหม่)
            </p>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="pt-3 border-t border-outline/15 flex items-center justify-between text-xs text-onSurface-muted">
        <span>เพิ่มขึ้นเฉลี่ย +{avgGrowth} รายการ/เดือน</span>
        <span className="font-bold text-primary font-mono">รวมล่าสุด {latestTotal} รายการ</span>
      </div>
    </div>
  );
}
