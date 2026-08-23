import React from 'react';
import { AlertTriangle, Archive, X } from 'lucide-react';

interface ArchiveConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  isArchiving?: boolean;
}

export default function ArchiveConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  isArchiving = true,
}: ArchiveConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-surface-card rounded-2xl border border-outline/30 shadow-level3 p-6 space-y-4 animate-scaleUp">
        <div className="flex items-start justify-between gap-3">
          <div className="w-10 h-10 rounded-xl bg-error-container text-error flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-onSurface-muted hover:bg-surface-variant transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h3 className="text-base font-heading font-bold text-onSurface">
            {isArchiving ? 'ยืนยันการเก็บองค์ความรู้นี้เข้าคลังเก็บถาวร?' : 'ยืนยันการเผยแพร่องค์ความรู้นี้อีกครั้ง?'}
          </h3>
          <p className="text-xs font-semibold text-primary mt-1 truncate">
            "{title}"
          </p>
          <div className="p-3 rounded-lg bg-error-container/30 border border-error/20 text-xs text-error mt-3 leading-relaxed">
            {isArchiving ? (
              <span>
                ⚠️ <strong>ผลกระทบต่อ AI:</strong> ระบบ AI Processing Engine (Phase 5) จะ<strong>หยุดนำข้อมูลนี้ไปตอบคำถามทันที</strong>ภายใน 1 นาที และข้อมูลจะถูกย้ายไปอยู่ที่แท็บ "คลังเก็บถาวร"
              </span>
            ) : (
              <span>
                ✓ <strong>ผลลัพธ์:</strong> องค์ความรู้นี้จะกลับสู่สถานะเผยแพร่ และระบบ AI จะเริ่มนำข้อมูลนี้ไปตอบคำถามได้อีกครั้ง
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-outline/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-outline text-xs font-medium text-onSurface hover:bg-surface-variant transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm transition-colors ${
              isArchiving
                ? 'bg-error hover:bg-red-700'
                : 'bg-primary hover:bg-primary-dark'
            }`}
          >
            {isArchiving ? 'ยืนยันเก็บถาวร' : 'ยืนยันเผยแพร่อีกครั้ง'}
          </button>
        </div>
      </div>
    </div>
  );
}
