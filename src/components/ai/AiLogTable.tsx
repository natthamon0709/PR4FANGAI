'use client';
import React, { useState } from 'react';
import { Search, Filter, Bot, Eye, Clock, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import FeedbackBadge from './FeedbackBadge';
import { getConfidenceLevel } from './ConfidenceScoreBar';
import AiLogDetailPanel from './AiLogDetailPanel';
import { AiQueryLog, FeedbackType } from '@/types/ai';

interface AiLogTableProps {
  logs: AiQueryLog[];
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (newPage: number) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  deptFilter: string;
  onDeptFilterChange: (dept: string) => void;
  confidenceFilter: string;
  onConfidenceFilterChange: (conf: string) => void;
  feedbackFilter: string;
  onFeedbackFilterChange: (fb: string) => void;
  departments: { department_id: string; name: string }[];
  isAdmin?: boolean;
  onRefresh?: () => void;
}

export default function AiLogTable({
  logs,
  total,
  page,
  totalPages,
  onPageChange,
  searchQuery,
  onSearchChange,
  deptFilter,
  onDeptFilterChange,
  confidenceFilter,
  onConfidenceFilterChange,
  feedbackFilter,
  onFeedbackFilterChange,
  departments,
  isAdmin = true,
  onRefresh
}: AiLogTableProps) {
  const [selectedLog, setSelectedLog] = useState<AiQueryLog | null>(null);

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl bg-surface-card border border-outline/30 shadow-level1 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-onSurface-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="ค้นหาข้อความคำถาม หรือเนื้อหาคำตอบ..."
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-outline bg-surface text-xs md:text-sm text-onSurface outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Filter Group */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {isAdmin && (
              <select
                value={deptFilter}
                onChange={(e) => onDeptFilterChange(e.target.value)}
                className="h-10 px-3 rounded-xl border border-outline bg-surface text-xs text-onSurface outline-none cursor-pointer"
              >
                <option value="all">ทุกฝ่ายงาน (ทั้งหมด)</option>
                {departments.map((d) => (
                  <option key={d.department_id} value={d.department_id}>
                    {d.name}
                  </option>
                ))}
              </select>
            )}

            <select
              value={confidenceFilter}
              onChange={(e) => onConfidenceFilterChange(e.target.value)}
              className="h-10 px-3 rounded-xl border border-outline bg-surface text-xs text-onSurface outline-none cursor-pointer"
            >
              <option value="all">ทุกระดับความมั่นใจ</option>
              <option value="high">🟢 สูง (≥ 75%)</option>
              <option value="medium">🟡 ปานกลาง (50-74%)</option>
              <option value="low">🔴 ต่ำ / Fallback (&lt; 50%)</option>
            </select>

            <select
              value={feedbackFilter}
              onChange={(e) => onFeedbackFilterChange(e.target.value)}
              className="h-10 px-3 rounded-xl border border-outline bg-surface text-xs text-onSurface outline-none cursor-pointer"
            >
              <option value="all">ทุกสถานะ Feedback</option>
              <option value="helpful">👍 ได้ผลดี</option>
              <option value="not_helpful">👎 ต้องปรับปรุง</option>
              <option value="none">— ยังไม่ประเมิน</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table (Desktop) & Card List (Mobile) */}
      <div className="rounded-2xl bg-surface-card border border-outline/30 shadow-level1 overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-onSurface-muted space-y-2">
            <Bot className="w-10 h-10 mx-auto text-onSurface-muted/50" />
            <p className="text-sm font-medium">ยังไม่พบบันทึกการสนทนาตามเงื่อนไขที่เลือก</p>
            <p className="text-xs">เมื่อมีคำถามผ่าน LINE หรือการประมวลผล RAG ข้อมูลจะปรากฏที่นี่</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-surface-variant/40 border-b border-outline/20 text-onSurface-muted font-heading font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-3.5 px-4">ข้อความคำถาม (Question)</th>
                    <th className="py-3.5 px-4 w-32 text-center">ความมั่นใจ</th>
                    <th className="py-3.5 px-4 w-28 text-center">Feedback</th>
                    <th className="py-3.5 px-4 w-24 text-right">เวลาตอบ</th>
                    <th className="py-3.5 px-4 w-36">เวลา</th>
                    <th className="py-3.5 px-4 w-20 text-center">ดูข้อมูล</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline/15">
                  {logs.map((log) => {
                    const conf = getConfidenceLevel(log.confidence_score);
                    const percent = Math.round(log.confidence_score * 100);

                    return (
                      <tr
                        key={log.log_id}
                        onClick={() => setSelectedLog(log)}
                        className="hover:bg-surface-variant/30 transition-colors cursor-pointer group"
                      >
                        {/* Question & Matched User */}
                        <td className="py-3.5 px-4 max-w-xs">
                          <div className="font-semibold text-onSurface line-clamp-1 group-hover:text-primary transition-colors">
                            {log.question_text}
                          </div>
                          <div className="text-[11px] text-onSurface-muted flex items-center gap-2 mt-0.5">
                            <span>{log.department_name || 'ส่วนกลาง'}</span>
                            <span>•</span>
                            <span className="truncate max-w-[120px]">
                              {log.matched_user_name || 'ผู้ใช้ LINE ทั่วไป'}
                            </span>
                            {log.is_fallback && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#FBE9E7] text-[#B3261E]">
                                Fallback
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Confidence Score */}
                        <td className="py-3.5 px-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border ${conf.badgeBg}`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: conf.dotColor }} />
                            <span>{percent}%</span>
                          </span>
                        </td>

                        {/* Feedback */}
                        <td className="py-3.5 px-4 text-center">
                          <FeedbackBadge feedback={log.feedback} />
                        </td>

                        {/* Response Time */}
                        <td className="py-3.5 px-4 text-right font-mono text-onSurface-muted">
                          {log.response_time_ms} ms
                        </td>

                        {/* Timestamp */}
                        <td className="py-3.5 px-4 font-mono text-[11px] text-onSurface-muted">
                          {new Date(log.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                          <span className="block text-[10px]">{new Date(log.created_at).toLocaleDateString('th-TH')}</span>
                        </td>

                        {/* Action View */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(log);
                            }}
                            className="p-1.5 rounded-lg text-onSurface-muted hover:text-primary hover:bg-primary-container/40 transition-colors"
                            title="เปิดดูรายละเอียด"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="md:hidden divide-y divide-outline/15">
              {logs.map((log) => {
                const conf = getConfidenceLevel(log.confidence_score);
                const percent = Math.round(log.confidence_score * 100);

                return (
                  <div
                    key={log.log_id}
                    onClick={() => setSelectedLog(log)}
                    className="p-4 space-y-2 hover:bg-surface-variant/30 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-xs text-onSurface line-clamp-2">
                        {log.question_text}
                      </h4>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border flex-shrink-0 ${conf.badgeBg}`}>
                        <span>{percent}%</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-onSurface-muted">
                      <FeedbackBadge feedback={log.feedback} />
                      <span className="font-mono">
                        {new Date(log.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-3.5 bg-surface-variant/20 border-t border-outline/20 flex items-center justify-between text-xs">
            <span className="text-onSurface-muted">
              แสดงหน้า <strong className="text-onSurface">{page}</strong> จาก <strong>{totalPages}</strong> (ทั้งหมด {total.toLocaleString()} รายการ)
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-outline bg-surface text-onSurface disabled:opacity-40 hover:bg-surface-variant transition-colors"
                title="หน้าก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg border border-outline bg-surface text-onSurface disabled:opacity-40 hover:bg-surface-variant transition-colors"
                title="หน้าถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <AiLogDetailPanel
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
          onFeedbackChange={(id, fb) => {
            setSelectedLog(prev => prev ? { ...prev, feedback: fb } : null);
            onRefresh?.();
          }}
          onMarkGapSuccess={() => {
            setSelectedLog(prev => prev ? { ...prev, is_marked_gap: true } : null);
            onRefresh?.();
          }}
        />
      )}
    </div>
  );
}
