'use client';
import React from 'react';
import Link from 'next/link';
import { IntegrationItem } from '@/types/settings';
import { FileSpreadsheet, Bot, Smartphone, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface IntegrationStatusCardProps {
  item: IntegrationItem;
}

export default function IntegrationStatusCard({ item }: IntegrationStatusCardProps) {
  const iconMap: Record<string, any> = {
    sheets: FileSpreadsheet,
    ai: Bot,
    line: Smartphone
  };

  const Icon = iconMap[item.key] || Bot;
  const isConnected = item.status === 'connected';

  return (
    <div className="p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 hover:shadow-level2 transition-all flex flex-col justify-between group">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="p-3 rounded-xl bg-primary-container/40 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
            <Icon className="w-7 h-7" />
          </div>
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
            isConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-300' : 'bg-rose-50 text-rose-700 border border-rose-300'
          }`}>
            {isConnected ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            <span>{item.statusLabel}</span>
          </span>
        </div>

        <div>
          <h3 className="font-heading font-bold text-base text-onSurface">{item.title}</h3>
        </div>

        {/* Details Table */}
        <div className="p-3 bg-surface rounded-xl border border-outline/20 space-y-1.5 text-xs">
          {item.details.map((d, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-onSurface-muted">{d.label}:</span>
              <span className="font-semibold text-onSurface">{d.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer shortcut link */}
      <div className="pt-4 mt-4 border-t border-outline/15 flex justify-end">
        <Link
          href={item.settingsUrl}
          className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
        >
          <span>ไปที่การตั้งค่าบริการนี้</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
