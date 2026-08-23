'use client';
import React from 'react';
import { BookOpen, Edit3, Megaphone } from 'lucide-react';

interface BroadcastSourceSelectorProps {
  sourceType: 'knowledge' | 'manual';
  onSourceTypeChange: (t: 'knowledge' | 'manual') => void;
  knowledgeList: { knowledge_id: string; title: string; summary?: string; content?: string }[];
  selectedKnowledgeId: string;
  onSelectKnowledge: (id: string) => void;
  disabled?: boolean;
}

export default function BroadcastSourceSelector({
  sourceType,
  onSourceTypeChange,
  knowledgeList,
  selectedKnowledgeId,
  onSelectKnowledge,
  disabled = false
}: BroadcastSourceSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-xs font-bold text-onSurface block">
        แหล่งที่มาของข้อความประชาสัมพันธ์ (Broadcast Source):
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Option 1: From Published Knowledge Base */}
        <label
          className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
            sourceType === 'knowledge'
              ? 'border-primary bg-primary-container/20 shadow-level1'
              : 'border-outline/30 bg-surface-card hover:border-outline/60'
          } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input
            type="radio"
            name="broadcast_source"
            value="knowledge"
            checked={sourceType === 'knowledge'}
            onChange={() => onSourceTypeChange('knowledge')}
            className="sr-only"
            disabled={disabled}
          />
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-heading font-bold text-xs text-onSurface block">
              ดึงจากข่าว/ประกาศที่เผยแพร่แล้ว
            </span>
            <p className="text-[11px] text-onSurface-muted mt-0.5">
              เลือกจากคลังองค์ความรู้ (Phase 3) ที่ผ่านการซิงค์และเผยแพร่แล้ว
            </p>
          </div>
        </label>

        {/* Option 2: Manual Text */}
        <label
          className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
            sourceType === 'manual'
              ? 'border-primary bg-primary-container/20 shadow-level1'
              : 'border-outline/30 bg-surface-card hover:border-outline/60'
          } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input
            type="radio"
            name="broadcast_source"
            value="manual"
            checked={sourceType === 'manual'}
            onChange={() => onSourceTypeChange('manual')}
            className="sr-only"
            disabled={disabled}
          />
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
            <Edit3 className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-heading font-bold text-xs text-onSurface block">
              พิมพ์ข้อความใหม่ด้วยตนเอง
            </span>
            <p className="text-[11px] text-onSurface-muted mt-0.5">
              เขียนหัวข้อและข้อความประชาสัมพันธ์ด่วนอิสระ
            </p>
          </div>
        </label>
      </div>

      {/* Dropdown to select knowledge if sourceType === 'knowledge' */}
      {sourceType === 'knowledge' && (
        <div className="pt-1">
          <label className="block text-[11px] font-semibold text-onSurface mb-1">
            เลือกข่าว/ประกาศต้นทาง:
          </label>
          <select
            value={selectedKnowledgeId}
            onChange={(e) => onSelectKnowledge(e.target.value)}
            disabled={disabled}
            className="w-full h-10 px-3 rounded-xl border border-outline bg-surface text-xs text-onSurface outline-none focus:border-primary cursor-pointer"
          >
            <option value="">-- กรุณาเลือกรายการองค์ความรู้ --</option>
            {knowledgeList.map((k) => (
              <option key={k.knowledge_id} value={k.knowledge_id}>
                {k.title}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
