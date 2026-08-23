'use client';
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
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            schedule.frequency === 'weekly' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
          }`}>
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
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all ${
            schedule.is_active
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
              : 'bg-slate-100 text-slate-500 border-slate-300 hover:bg-slate-200'
          }`}
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
