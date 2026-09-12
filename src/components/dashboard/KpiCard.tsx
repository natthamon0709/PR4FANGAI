import React from 'react';
import Link from 'next/link';
import { KpiMetric } from '@/types/dashboard';
import { 
  BookOpen, 
  Users, 
  MessageSquare, 
  FileSpreadsheet, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight,
  Briefcase,
  CheckCircle2
} from 'lucide-react';

interface KpiCardProps {
  metric: KpiMetric;
}

export default function KpiCard({ metric }: KpiCardProps) {
  const getIcon = () => {
    switch (metric.key) {
      case 'total_knowledge':
      case 'my_department_knowledge':
        return <BookOpen className="w-5 h-5 text-primary" />;
      case 'total_users':
        return <Users className="w-5 h-5 text-secondary" />;
      case 'ai_queries':
        return <MessageSquare className="w-5 h-5 text-primary" />;
      case 'my_monthly_work':
        return <Briefcase className="w-5 h-5 text-secondary" />;
      case 'pending_sync':
      case 'my_dept_pending_sync':
        return <FileSpreadsheet className="w-5 h-5 text-secondary-dark" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-primary" />;
    }
  };

  const getCardTheme = () => {
    switch (metric.color) {
      case 'primary':
        return {
          border: 'border-outline/50 hover:border-primary/40',
          iconBg: 'bg-primary/10 text-primary border border-primary/20',
          accent: 'text-primary'
        };
      case 'secondary':
        return {
          border: 'border-outline/50 hover:border-secondary/40',
          iconBg: 'bg-amber-500/10 text-amber-700 border border-amber-500/20',
          accent: 'text-secondary-dark'
        };
      case 'error':
        return {
          border: 'border-outline/50 hover:border-error/40',
          iconBg: 'bg-red-500/10 text-red-600 border border-red-500/20',
          accent: 'text-error'
        };
      case 'success':
      default:
        return {
          border: 'border-outline/50 hover:border-success/40',
          iconBg: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
          accent: 'text-success'
        };
    }
  };

  const theme = getCardTheme();

  const cardBody = (
    <div className={`p-5 rounded-2xl border ${theme.border} bg-surface-card shadow-card modern-card-hover hover:shadow-card-hover group relative flex flex-col justify-between h-full`}>
      {/* Top row: Label & Icon */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-heading font-semibold text-onSurface-variant truncate">
          {metric.label}
        </span>
        <div className={`w-10 h-10 rounded-2xl ${theme.iconBg} flex items-center justify-center flex-shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-110`}>
          {getIcon()}
        </div>
      </div>

      {/* Main Metric Number */}
      <div className="my-1.5">
        <div className="flex items-baseline gap-1.5">
          <span className="font-heading font-extrabold text-2xl sm:text-3xl lg:text-4xl text-onSurface tracking-tight">
            {typeof metric.value === 'number' ? metric.value.toLocaleString('th-TH') : metric.value}
          </span>
          {metric.unit && (
            <span className="text-xs text-onSurface-muted font-medium">
              {metric.unit}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Trend / Subtitle */}
      <div className="pt-2.5 mt-2 border-t border-outline/30 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          {metric.trendDirection === 'up' && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium text-[10px] border border-emerald-200/50">
              <TrendingUp className="w-3 h-3" />
              <span>{metric.trendText || 'เพิ่มขึ้น'}</span>
            </span>
          )}
          {metric.trendDirection === 'down' && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-medium text-[10px] border border-rose-200/50">
              <TrendingDown className="w-3 h-3" />
              <span>{metric.trendText || 'ลดลง'}</span>
            </span>
          )}
          {!metric.trendDirection && (
            <span className="text-onSurface-muted text-[11px] font-medium truncate">
              {metric.trendText || '-'}
            </span>
          )}
        </div>

        {metric.href && (
          <div className="w-6 h-6 rounded-full bg-surface-variant/50 flex items-center justify-center text-onSurface-muted group-hover:bg-primary group-hover:text-white transition-colors flex-shrink-0">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    </div>
  );

  if (metric.href) {
    return <Link href={metric.href} className="block h-full">{cardBody}</Link>;
  }

  return cardBody;
}
