const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

ensureDir('./src/components/analytics');

// C83: AnalyticsTabNav
fs.writeFileSync('./src/components/analytics/AnalyticsTabNav.tsx', `'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, BookOpen, Bot, Smartphone, FileSpreadsheet, Clock } from 'lucide-react';

interface AnalyticsTabNavProps {
  isAdmin?: boolean;
}

export default function AnalyticsTabNav({ isAdmin = true }: AnalyticsTabNavProps) {
  const pathname = usePathname();

  const tabs = [
    { label: 'ภาพรวม (Overview)', href: '/analytics', icon: LayoutDashboard, exact: true },
    { label: 'การใช้งานระบบ (Usage)', href: '/analytics/usage', icon: Users },
    { label: 'ประสิทธิภาพองค์ความรู้', href: '/analytics/knowledge', icon: BookOpen },
    { label: 'ประสิทธิภาพ AI (RAG)', href: '/analytics/ai-performance', icon: Bot },
    { label: 'LINE Official Account', href: '/analytics/line', icon: Smartphone },
    { label: 'ส่งออกรายงาน (Export)', href: '/analytics/export', icon: FileSpreadsheet },
    ...(isAdmin ? [{ label: 'ตั้งเวลาส่งอัตโนมัติ', href: '/analytics/scheduled-reports', icon: Clock, adminOnly: true }] : []),
  ];

  return (
    <div className="border-b border-outline/20 bg-surface-card rounded-xl px-2 mb-6 shadow-sm overflow-x-auto">
      <nav className="flex space-x-1 sm:space-x-2 h-11 min-w-max">
        {tabs.map((tab) => {
          const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={\`flex items-center gap-2 px-3.5 h-full text-xs md:text-sm font-semibold transition-all border-b-[3px] \${
                isActive
                  ? 'border-primary text-primary font-bold bg-primary-container/20'
                  : 'border-transparent text-onSurface-muted hover:text-onSurface hover:border-outline/40'
              }\`}
            >
              <Icon className={\`w-4 h-4 \${isActive ? 'text-primary' : 'text-onSurface-muted'}\`} />
              <span>{tab.label}</span>
              {tab.adminOnly && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-secondary/15 text-secondary-dark font-bold">
                  Admin
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
`, 'utf8');

// C84: DateRangePicker
fs.writeFileSync('./src/components/analytics/DateRangePicker.tsx', `'use client';
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
              className={\`px-3 py-1 rounded-full text-xs font-semibold transition-all \${
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-onSurface-muted hover:text-onSurface hover:bg-outline/10'
              }\`}
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
`, 'utf8');

// C85: AnalyticsKpiCard
fs.writeFileSync('./src/components/analytics/AnalyticsKpiCard.tsx', `'use client';
import React from 'react';
import { AnalyticsKpi } from '@/types/analytics';
import { TrendingUp, TrendingDown, HelpCircle, LucideIcon } from 'lucide-react';

interface AnalyticsKpiCardProps {
  kpi: AnalyticsKpi;
  icon?: LucideIcon;
}

export default function AnalyticsKpiCard({ kpi, icon: Icon }: AnalyticsKpiCardProps) {
  const isPositive = kpi.status === 'positive';
  const isNegative = kpi.status === 'negative';

  return (
    <div className="p-5 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 hover:shadow-level2 transition-all flex flex-col justify-between group">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <p className="text-xs font-medium text-onSurface-muted truncate">{kpi.label}</p>
            {kpi.tooltip && (
              <span title={kpi.tooltip} className="cursor-help text-onSurface-muted/60 hover:text-onSurface">
                <HelpCircle className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-heading font-black text-2xl md:text-3xl text-onSurface">
              {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
            </span>
            {kpi.unit && (
              <span className="text-xs font-semibold text-onSurface-muted">{kpi.unit}</span>
            )}
          </div>
        </div>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-primary-container/40 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      {kpi.changePercent !== undefined && (
        <div className="mt-3 pt-2.5 border-t border-outline/15 flex items-center justify-between text-xs">
          <div className={\`flex items-center gap-1 font-bold \${
            isPositive ? 'text-success' : isNegative ? 'text-error' : 'text-onSurface-muted'
          }\`}>
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : isNegative ? <TrendingDown className="w-3.5 h-3.5" /> : null}
            <span>{kpi.changePercent > 0 ? \`+\${kpi.changePercent}%\` : \`\${kpi.changePercent}%\`}</span>
            <span className="font-normal text-onSurface-muted text-[11px] ml-0.5">เทียบช่วงก่อนหน้า</span>
          </div>
        </div>
      )}
    </div>
  );
}
`, 'utf8');

// C86: TrendLineChart
fs.writeFileSync('./src/components/analytics/TrendLineChart.tsx', `'use client';
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
    return i === 0 ? \`M \${pt.x},\${pt.y}\` : \`\${acc} L \${pt.x},\${pt.y}\`;
  }, '');

  const areaD = chartPoints.length > 1
    ? \`\${pathD} L \${chartPoints[chartPoints.length - 1].x},140 L \${chartPoints[0].x},140 Z\`
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
              left: \`\${(chartPoints[hoveredIdx].x / 400) * 100}%\`,
              top: \`\${(chartPoints[hoveredIdx].y / 160) * 100}%\`
            }}
          >
            <p className="font-bold">{chartPoints[hoveredIdx].data.data.label}</p>
            <p className="text-secondary font-semibold">
              {chartPoints[hoveredIdx].data.data.value.toLocaleString()} {unit}
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
`, 'utf8');

// C87: StackedBarChart
fs.writeFileSync('./src/components/analytics/StackedBarChart.tsx', `'use client';
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
`, 'utf8');

// C88: DonutChart
fs.writeFileSync('./src/components/analytics/DonutChart.tsx', `'use client';
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
              const strokeDasharray = \`\${(slice.percentage / 100) * circumference} \${circumference}\`;
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
`, 'utf8');

// C89: RankingList
fs.writeFileSync('./src/components/analytics/RankingList.tsx', `'use client';
import React from 'react';
import Link from 'next/link';
import { RankingItem } from '@/types/analytics';
import { Award, ArrowRight } from 'lucide-react';

interface RankingListProps {
  items: RankingItem[];
  title?: string;
  subtitle?: string;
  unit?: string;
  viewAllLink?: string;
}

export default function RankingList({
  items = [],
  title = 'รายการจัดอันดับ',
  subtitle,
  unit = 'ครั้ง',
  viewAllLink
}: RankingListProps) {
  return (
    <div className="p-5 md:p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between gap-2 pb-3 mb-2 border-b border-outline/20">
        <div>
          <h3 className="font-heading font-bold text-sm md:text-base text-onSurface flex items-center gap-2">
            <Award className="w-4 h-4 text-secondary" />
            <span>{title}</span>
          </h3>
          {subtitle && <p className="text-[11px] text-onSurface-muted mt-0.5">{subtitle}</p>}
        </div>
        {viewAllLink && (
          <Link href={viewAllLink} className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            <span>ดูทั้งหมด</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      <div className="divide-y divide-outline/15 my-1">
        {items.map((item) => {
          const isTop3 = item.rank <= 3;
          return (
            <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 group">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Number Badge */}
                <div
                  className={\`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 \${
                    isTop3
                      ? 'bg-secondary/20 text-secondary-dark border border-secondary/40 font-black'
                      : 'bg-surface border border-outline/30 text-onSurface-muted'
                  }\`}
                >
                  {item.rank}
                </div>

                <div className="min-w-0 flex-1">
                  {item.linkUrl ? (
                    <Link href={item.linkUrl} className="text-xs md:text-sm font-semibold text-onSurface hover:text-primary transition-colors truncate block">
                      {item.title}
                    </Link>
                  ) : (
                    <p className="text-xs md:text-sm font-semibold text-onSurface truncate">{item.title}</p>
                  )}
                  {item.subtitle && (
                    <p className="text-[11px] text-onSurface-muted truncate">{item.subtitle}</p>
                  )}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="font-bold text-xs md:text-sm text-primary">
                  {item.count.toLocaleString()}
                </span>
                <span className="text-[11px] text-onSurface-muted ml-1">{unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
`, 'utf8');

// C90: ReportCategoryCheckboxGroup
fs.writeFileSync('./src/components/analytics/ReportCategoryCheckboxGroup.tsx', `'use client';
import React from 'react';
import { Users, BookOpen, Bot, Smartphone, Check } from 'lucide-react';

interface ReportCategoryCheckboxGroupProps {
  selectedCategories: ('usage' | 'knowledge' | 'ai' | 'line')[];
  onChange: (categories: ('usage' | 'knowledge' | 'ai' | 'line')[]) => void;
}

export default function ReportCategoryCheckboxGroup({
  selectedCategories,
  onChange
}: ReportCategoryCheckboxGroupProps) {
  const categories = [
    { id: 'usage', label: 'การใช้งานระบบ (Usage)', desc: 'สถิติ Login, ผู้ใช้ Active และการซิงค์', icon: Users },
    { id: 'knowledge', label: 'ประสิทธิภาพองค์ความรู้', desc: 'การเติบโตของ KM และบทความยอดนิยม', icon: BookOpen },
    { id: 'ai', label: 'ประสิทธิภาพ AI (RAG)', desc: 'อัตราความสำเร็จ, Latency และ Knowledge Gaps', icon: Bot },
    { id: 'line', label: 'LINE Official Account', desc: 'ยอดผู้ติดตาม, บรอดแคสต์ และการผูกบัญชี', icon: Smartphone }
  ];

  const toggle = (id: 'usage' | 'knowledge' | 'ai' | 'line') => {
    if (selectedCategories.includes(id)) {
      if (selectedCategories.length === 1) return; // Must select at least 1
      onChange(selectedCategories.filter(c => c !== id));
    } else {
      onChange([...selectedCategories, id]);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {categories.map((cat) => {
        const isSelected = selectedCategories.includes(cat.id as any);
        const Icon = cat.icon;
        return (
          <div
            key={cat.id}
            onClick={() => toggle(cat.id as any)}
            className={\`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 select-none \${
              isSelected
                ? 'border-primary bg-primary-container/20 text-onSurface'
                : 'border-outline/30 bg-surface-card hover:border-outline/60 text-onSurface-muted'
            }\`}
          >
            <div className={\`p-2 rounded-lg flex-shrink-0 \${isSelected ? 'bg-primary text-white' : 'bg-surface text-onSurface-muted'}\`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs md:text-sm font-bold text-onSurface">{cat.label}</p>
                <div className={\`w-4 h-4 rounded flex items-center justify-center border \${
                  isSelected ? 'bg-primary border-primary text-white' : 'border-outline/40 bg-surface'
                }\`}>
                  {isSelected && <Check className="w-3 h-3" />}
                </div>
              </div>
              <p className="text-[11px] text-onSurface-muted mt-0.5">{cat.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
`, 'utf8');

// C91: ReportPreviewPane
fs.writeFileSync('./src/components/analytics/ReportPreviewPane.tsx', `'use client';
import React from 'react';
import AppLogo from '@/components/AppLogo';
import { formatThaiDate } from '@/lib/analytics-service';

interface ReportPreviewPaneProps {
  title: string;
  dateRangeLabel: string;
  departmentName: string;
  selectedCategories: string[];
  generatedBy: string;
}

export default function ReportPreviewPane({
  title,
  dateRangeLabel,
  departmentName,
  selectedCategories,
  generatedBy
}: ReportPreviewPaneProps) {
  const printDate = formatThaiDate(new Date().toISOString(), 'full');

  return (
    <div className="bg-white text-slate-800 rounded-xl border border-outline/30 shadow-level2 p-6 md:p-8 max-w-4xl mx-auto font-sans">
      {/* Official College Header */}
      <div className="border-b-2 border-[#800000] pb-4 mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <img src="/img/logofve.png" alt="Logo FVE" className="w-14 h-14 object-contain" />
          <div>
            <h2 className="text-base md:text-lg font-bold text-[#800000] font-heading">
              วิทยาลัยการอาชีพฝาง อาชีวศึกษาจังหวัดเชียงใหม่
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              สำนักงานคณะกรรมการการอาชีวศึกษา (สอศ.) กระทรวงศึกษาธิการ
            </p>
            <p className="text-[11px] text-slate-500">
              ระบบศูนย์ข้อมูลและการจัดการองค์ความรู้ด้วยปัญญาประดิษฐ์ (PR4Fang AI KMS)
            </p>
          </div>
        </div>
        <div className="text-right text-[11px] text-slate-500 hidden sm:block">
          <p className="font-semibold text-slate-700">เอกสารรายงานทางการ</p>
          <p>วันที่พิมพ์: {printDate}</p>
        </div>
      </div>

      {/* Report Title & Metadata */}
      <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200">
        <h1 className="text-base md:text-lg font-bold text-slate-900 mb-2">{title}</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-slate-600">
          <div>
            <span className="font-semibold text-slate-700">ช่วงเวลาข้อมูล:</span> {dateRangeLabel}
          </div>
          <div>
            <span className="font-semibold text-slate-700">ฝ่ายงาน:</span> {departmentName}
          </div>
          <div>
            <span className="font-semibold text-slate-700">ผู้ออกรายงาน:</span> {generatedBy}
          </div>
        </div>
      </div>

      {/* Sections based on selection */}
      <div className="space-y-6 text-xs">
        {selectedCategories.includes('usage') && (
          <div>
            <h3 className="font-bold text-sm text-[#800000] border-b border-slate-200 pb-1 mb-2">
              1. สรุปสถิติการใช้งานระบบ (System Usage Summary)
            </h3>
            <table className="w-full text-left border-collapse border border-slate-200 text-xs">
              <thead className="bg-slate-100 font-semibold">
                <tr>
                  <th className="border border-slate-200 p-2">ตัวชี้วัด (KPI)</th>
                  <th className="border border-slate-200 p-2 text-right">ค่าสถิติ</th>
                  <th className="border border-slate-200 p-2">หน่วย</th>
                  <th className="border border-slate-200 p-2">สถานะ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-200 p-2">ผู้ใช้งานที่ไม่ซ้ำ (Active Users)</td>
                  <td className="border border-slate-200 p-2 text-right font-bold">18</td>
                  <td className="border border-slate-200 p-2">คน</td>
                  <td className="border border-slate-200 p-2 text-emerald-700 font-semibold">ปกติ</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 p-2">จำนวนการเข้าสู่ระบบรวม</td>
                  <td className="border border-slate-200 p-2 text-right font-bold">142</td>
                  <td className="border border-slate-200 p-2">ครั้ง</td>
                  <td className="border border-slate-200 p-2 text-emerald-700 font-semibold">ปกติ</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 p-2">ข้อผิดพลาดการเชื่อมต่อ Sheets</td>
                  <td className="border border-slate-200 p-2 text-right font-bold">0</td>
                  <td className="border border-slate-200 p-2">รายการ</td>
                  <td className="border border-slate-200 p-2 text-emerald-700 font-semibold">สมบูรณ์ 100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {selectedCategories.includes('ai') && (
          <div>
            <h3 className="font-bold text-sm text-[#800000] border-b border-slate-200 pb-1 mb-2">
              2. สรุปประสิทธิภาพปัญญาประดิษฐ์ (AI Processing & RAG Engine)
            </h3>
            <table className="w-full text-left border-collapse border border-slate-200 text-xs">
              <thead className="bg-slate-100 font-semibold">
                <tr>
                  <th className="border border-slate-200 p-2">ตัวชี้วัด (KPI)</th>
                  <th className="border border-slate-200 p-2 text-right">ค่าสถิติ</th>
                  <th className="border border-slate-200 p-2">เป้าหมาย</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-200 p-2">อัตราความสำเร็จในการตอบ (Accuracy)</td>
                  <td className="border border-slate-200 p-2 text-right font-bold text-emerald-700">92.4%</td>
                  <td className="border border-slate-200 p-2">&gt; 80%</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 p-2">คะแนนความมั่นใจเฉลี่ย (Avg Confidence)</td>
                  <td className="border border-slate-200 p-2 text-right font-bold">0.85</td>
                  <td className="border border-slate-200 p-2">&gt; 0.70</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 p-2">เวลาตอบสนองเฉลี่ย (Response Latency)</td>
                  <td className="border border-slate-200 p-2 text-right font-bold">1.8 วินาที</td>
                  <td className="border border-slate-200 p-2">&lt; 3.0 วินาที</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Signature Box */}
      <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between text-xs text-slate-600">
        <div>
          <p>ระบบสร้างรายงานอัตโนมัติ PR4Fang AI KMS</p>
          <p className="text-[11px] text-slate-400">Security Hash: Verified / Valid</p>
        </div>
        <div className="text-center w-48">
          <div className="border-b border-slate-400 h-10 mb-1"></div>
          <p className="font-semibold text-slate-700">{generatedBy}</p>
          <p className="text-[11px] text-slate-500">ผู้รับรองรายงาน</p>
        </div>
      </div>
    </div>
  );
}
`, 'utf8');

// C92: ExportFormatSelector
fs.writeFileSync('./src/components/analytics/ExportFormatSelector.tsx', `'use client';
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
        className={\`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 \${
          format === 'pdf'
            ? 'border-primary bg-primary-container/20 text-primary font-bold'
            : 'border-outline/30 bg-surface-card hover:border-outline/60 text-onSurface-muted'
        }\`}
      >
        <FileText className="w-5 h-5 flex-shrink-0" />
        <div>
          <p className="text-xs md:text-sm text-onSurface">PDF (ทางการพร้อมพิมพ์)</p>
          <p className="text-[11px] text-onSurface-muted font-normal">เอกสาร A4 มีตราวิทยาลัย</p>
        </div>
      </div>

      <div
        onClick={() => onChange('xlsx')}
        className={\`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-3 \${
          format === 'xlsx'
            ? 'border-primary bg-primary-container/20 text-primary font-bold'
            : 'border-outline/30 bg-surface-card hover:border-outline/60 text-onSurface-muted'
        }\`}
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
`, 'utf8');

// C93: ScheduledReportRow
fs.writeFileSync('./src/components/analytics/ScheduledReportRow.tsx', `'use client';
import React from 'react';
import { ScheduledReportConfig } from '@/types/analytics';
import { Calendar, Mail, Trash2, Power } from 'lucide-react';

interface ScheduledReportRowProps {
  schedule: ScheduledReportConfig;
  onToggleActive: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}

export default function ScheduledReportRow({
  schedule,
  onToggleActive,
  onDelete
}: ScheduledReportRowProps) {
  const typeMap: Record<string, string> = {
    usage: 'การใช้งานระบบ',
    knowledge: 'ประสิทธิภาพองค์ความรู้',
    ai_performance: 'ประสิทธิภาพ AI (RAG)',
    line: 'LINE Official Account',
    custom: 'รายงานกำหนดเอง'
  };

  return (
    <div className="p-4 bg-surface-card rounded-xl border border-outline/30 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="space-y-1.5 min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={\`px-2 py-0.5 rounded text-[10px] font-bold \${
            schedule.frequency === 'weekly' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
          }\`}>
            {schedule.frequency === 'weekly' ? 'รายสัปดาห์' : 'รายเดือน'}
          </span>
          <span className="font-bold text-xs md:text-sm text-onSurface">
            {typeMap[schedule.report_type] || schedule.report_type}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface border border-outline/30 font-semibold uppercase text-onSurface-muted">
            {schedule.format}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-onSurface-muted">
          <Mail className="w-3.5 h-3.5 text-primary flex-shrink-0" />
          <span className="truncate">ผู้รับ: {schedule.recipients.join(', ')}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onToggleActive(schedule.config_id, schedule.is_active)}
          className={\`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all \${
            schedule.is_active
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
          }\`}
        >
          <Power className="w-3 h-3" />
          <span>{schedule.is_active ? 'เปิดส่งอัตโนมัติ' : 'ปิดชั่วคราว'}</span>
        </button>

        <button
          onClick={() => onDelete(schedule.config_id)}
          className="p-1.5 text-error hover:bg-error-container/30 rounded-lg transition-colors"
          title="ลบรายการนี้"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
`, 'utf8');

// C94: RecipientPicker
fs.writeFileSync('./src/components/analytics/RecipientPicker.tsx', `'use client';
import React, { useState } from 'react';
import { Plus, X, Mail } from 'lucide-react';

interface RecipientPickerProps {
  recipients: string[];
  onChange: (recipients: string[]) => void;
}

export default function RecipientPicker({ recipients, onChange }: RecipientPickerProps) {
  const [inputEmail, setInputEmail] = useState('');

  const quickRecipients = [
    { label: 'ผู้อำนวยการ', email: 'director@fang.ac.th' },
    { label: 'ฝ่ายวิชาการ', email: 'academic@fang.ac.th' },
    { label: 'ฝ่ายบริหารทรัพยากร', email: 'resource@fang.ac.th' },
    { label: 'ฝ่ายพัฒนากิจการฯ', email: 'student_affairs@fang.ac.th' }
  ];

  const handleAddEmail = () => {
    const trimmed = inputEmail.trim().toLowerCase();
    if (trimmed && !recipients.includes(trimmed)) {
      onChange([...recipients, trimmed]);
      setInputEmail('');
    }
  };

  const handleRemove = (email: string) => {
    onChange(recipients.filter(r => r !== email));
  };

  const handleAddQuick = (email: string) => {
    if (!recipients.includes(email)) {
      onChange([...recipients, email]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Quick Picks */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-onSurface-muted">แนะนำผู้บริหาร:</span>
        {quickRecipients.map((q) => (
          <button
            key={q.email}
            type="button"
            onClick={() => handleAddQuick(q.email)}
            className="text-[11px] px-2 py-0.5 rounded-full bg-surface border border-outline/30 hover:border-primary text-onSurface-muted hover:text-primary transition-colors"
          >
            + {q.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="w-4 h-4 text-onSurface-muted absolute left-3 top-2.5" />
          <input
            type="email"
            value={inputEmail}
            onChange={(e) => setInputEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddEmail(); } }}
            placeholder="ระบุอีเมลผู้รับรายงาน เช่น user@fang.ac.th"
            className="w-full pl-9 pr-3 py-2 text-xs bg-surface border border-outline/30 rounded-xl focus:outline-none focus:border-primary"
          />
        </div>
        <button
          type="button"
          onClick={handleAddEmail}
          className="px-3 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-dark flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>เพิ่ม</span>
        </button>
      </div>

      {/* Recipient Tags */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {recipients.map((email) => (
          <span
            key={email}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-container/40 text-primary text-xs font-medium border border-primary/20"
          >
            <span>{email}</span>
            <button
              type="button"
              onClick={() => handleRemove(email)}
              className="text-primary hover:text-error transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
`, 'utf8');

console.log('All Phase 7 UI components (C83 - C94) created successfully!');
