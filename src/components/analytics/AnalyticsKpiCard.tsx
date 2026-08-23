'use client';
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
          <div className={`flex items-center gap-1 font-bold ${
            isPositive ? 'text-success' : isNegative ? 'text-error' : 'text-onSurface-muted'
          }`}>
            {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : isNegative ? <TrendingDown className="w-3.5 h-3.5" /> : null}
            <span>{kpi.changePercent > 0 ? `+${kpi.changePercent}%` : `${kpi.changePercent}%`}</span>
            <span className="font-normal text-onSurface-muted text-[11px] ml-0.5">เทียบช่วงก่อนหน้า</span>
          </div>
        </div>
      )}
    </div>
  );
}
