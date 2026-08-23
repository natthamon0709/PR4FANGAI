'use client';
import React from 'react';
import { ContentType } from '@/types/knowledge';
import { CONTENT_TYPE_CONFIG } from './ContentTypeBadge';
import { Layers } from 'lucide-react';

interface KnowledgeTypeTabsProps {
  activeType: ContentType | 'all';
  onTypeChange: (type: ContentType | 'all') => void;
  typeCounts?: Record<string, number>;
}

const TABS: { key: ContentType | 'all'; label: string }[] = [
  { key: 'all', label: 'ทั้งหมด' },
  { key: 'news', label: 'ข่าวประชาสัมพันธ์' },
  { key: 'announcement', label: 'ประกาศ' },
  { key: 'faq', label: 'FAQ' },
  { key: 'document', label: 'เอกสาร' },
  { key: 'manual', label: 'คู่มือ' },
  { key: 'regulation', label: 'ระเบียบ' },
  { key: 'form', label: 'แบบฟอร์ม' },
  { key: 'service_process', label: 'ขั้นตอนบริการ' },
];

export default function KnowledgeTypeTabs({
  activeType,
  onTypeChange,
  typeCounts = {},
}: KnowledgeTypeTabsProps) {
  return (
    <div className="w-full overflow-x-auto scrollbar-none border-b border-outline/20 bg-surface-card rounded-xl p-1.5 shadow-sm">
      <div className="flex items-center gap-1.5 min-w-max">
        {TABS.map((tab) => {
          const isActive = activeType === tab.key;
          const count = typeCounts[tab.key] ?? 0;
          const config = tab.key !== 'all' ? CONTENT_TYPE_CONFIG[tab.key] : null;

          return (
            <button
              key={tab.key}
              onClick={() => onTypeChange(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-heading font-medium transition-all ${
                isActive
                  ? 'bg-primary text-white shadow-sm font-bold'
                  : 'text-onSurface-variant hover:bg-surface-variant/60 hover:text-onSurface'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-surface-variant text-onSurface-muted'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
