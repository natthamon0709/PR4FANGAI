'use client';
import React, { useState } from 'react';
import { KnowledgeVersion } from '@/types/knowledge';
import { formatThaiRelativeTime } from '@/components/dashboard/RelativeTimeLabel';
import { History, RotateCcw, CheckCircle2, User, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface VersionHistoryPanelProps {
  versions: KnowledgeVersion[];
  onRestore: (versionId: string, versionNo: number) => void;
  canRestore?: boolean;
}

export default function VersionHistoryPanel({
  versions = [],
  onRestore,
  canRestore = false,
}: VersionHistoryPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(versions[0]?.version_id || null);

  if (!versions || versions.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-onSurface-muted bg-surface-card rounded-2xl border border-outline/30">
        ยังไม่มีประวัติเวอร์ชันย้อนหลัง
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-outline/20">
        <h3 className="font-heading font-bold text-sm text-onSurface flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <span>ประวัติการแก้ไขและเวอร์ชันย้อนหลัง ({versions.length} เวอร์ชัน)</span>
        </h3>
      </div>

      <div className="space-y-3">
        {versions.map((ver, idx) => {
          const isLatest = idx === 0;
          const isExpanded = expandedId === ver.version_id;

          return (
            <div
              key={ver.version_id}
              className={`rounded-xl border transition-all ${
                isLatest
                  ? 'bg-primary-container/20 border-primary/40'
                  : 'bg-surface-card border-outline/30'
              }`}
            >
              {/* Version Card Header */}
              <div
                onClick={() => setExpandedId(isExpanded ? null : ver.version_id)}
                className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                    isLatest ? 'bg-primary text-white' : 'bg-surface-variant text-onSurface-variant'
                  }`}>
                    v{ver.version_no}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-onSurface truncate max-w-xs sm:max-w-md">
                        {ver.title_snapshot}
                      </h4>
                      {isLatest && (
                        <span className="px-2 py-0.2 rounded-full bg-primary text-white text-[10px] font-bold">
                          เวอร์ชันปัจจุบัน
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-onSurface-muted mt-0.5">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-onSurface-muted/70" />
                        <span>{ver.editor_name || 'ผู้ดูแลระบบ'}</span>
                      </span>
                      <span>· {formatThaiRelativeTime(ver.edited_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!isLatest && canRestore && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRestore(ver.version_id, ver.version_no);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-primary/50 bg-primary-container/40 hover:bg-primary hover:text-white text-primary text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                      title="กู้คืนข้อมูลกลับสู่เวอร์ชันนี้"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">กู้คืนเวอร์ชันนี้</span>
                    </button>
                  )}

                  <div className="p-1 text-onSurface-muted">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Collapsible Version Snapshot Content */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-outline/15 space-y-3 text-xs animate-fadeIn">
                  {ver.summary_snapshot && (
                    <div>
                      <span className="font-bold text-[11px] text-onSurface-muted block mb-1">สรุปย่อ:</span>
                      <p className="p-2.5 rounded-lg bg-surface text-onSurface leading-relaxed">
                        {ver.summary_snapshot}
                      </p>
                    </div>
                  )}

                  <div>
                    <span className="font-bold text-[11px] text-onSurface-muted block mb-1">เนื้อหา Snapshot:</span>
                    <div className="p-3 rounded-lg bg-surface text-onSurface font-mono text-[11px] whitespace-pre-wrap max-h-48 overflow-y-auto leading-relaxed">
                      {ver.content_snapshot}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
