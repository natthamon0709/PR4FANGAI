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
          bg: 'bg-surface-card',
          border: 'border-outline/30 hover:border-primary/50',
          iconBg: 'bg-primary-container/60',
          accent: 'text-primary'
        };
      case 'secondary':
        return {
          bg: 'bg-surface-card',
          border: 'border-outline/30 hover:border-secondary/50',
          iconBg: 'bg-secondary-container/60',
          accent: 'text-secondary-dark'
        };
      case 'error':
        return {
          bg: 'bg-surface-card',
          border: 'border-outline/30 hover:border-error/40',
          iconBg: 'bg-error-container/60',
          accent: 'text-error'
        };
      case 'success':
      default:
        return {
          bg: 'bg-surface-card',
          border: 'border-outline/30 hover:border-success/40',
          iconBg: 'bg-success-container/60',
          accent: 'text-success'
        };
    }
  };

  const theme = getCardTheme();

  const cardBody = (
    <div className={`p-5 rounded-2xl border ${theme.border} ${theme.bg} shadow-level1 transition-all hover:shadow-level2 group relative flex flex-col justify-between h-full`}>
      {/* Top row: Label & Icon */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="text-xs font-heading font-semibold text-onSurface-variant truncate">
          {metric.label}
        </span>
        <div className={`w-9 h-9 rounded-xl ${theme.iconBg} flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105`}>
          {getIcon()}
        </div>
      </div>

      {/* Main Metric Number (Style Guide: IBM Plex Sans Thai 700 28px) */}
      <div className="my-1">
        <div className="flex items-baseline gap-1.5">
          <span className="font-heading font-extrabold text-2xl sm:text-3xl text-onSurface tracking-tight">
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
      <div className="pt-2 mt-2 border-t border-outline/15 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          {metric.trendDirection === 'up' && (
            <TrendingUp className="w-3.5 h-3.5 text-success" />
          )}
          {metric.trendDirection === 'down' && (
            <TrendingDown className="w-3.5 h-3.5 text-error" />
          )}
          <span className="text-onSurface-muted text-[11px] font-medium truncate">
            {metric.trendText || '-'}
          </span>
        </div>

        {metric.href && (
          <ArrowRight className="w-3.5 h-3.5 text-onSurface-muted group-hover:text-primary transition-colors flex-shrink-0" />
        )}
      </div>
    </div>
  );

  if (metric.href) {
    return <Link href={metric.href} className="block h-full">{cardBody}</Link>;
  }

  return cardBody;
}
