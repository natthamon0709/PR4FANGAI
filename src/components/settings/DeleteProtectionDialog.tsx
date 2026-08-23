'use client';
import React, { useState } from 'react';
import { AlertTriangle, Power, Trash2, X, Loader2 } from 'lucide-react';

interface DeleteProtectionDialogProps {
  isOpen: boolean;
  type: 'department' | 'sub_department';
  id: string;
  name: string;
  userCount: number;
  knowledgeCount: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteProtectionDialog({
  isOpen,
  type,
  id,
  name,
  userCount,
  knowledgeCount,
  onClose,
  onSuccess
}: DeleteProtectionDialogProps) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const hasReferences = userCount > 0 || knowledgeCount > 0;
  const endpoint = type === 'department' ? `/api/settings/departments/${id}` : `/api/settings/sub-departments/${id}`;

  const handleDeactivate = async () => {
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch(`${endpoint}?force=deactivate`, { method: 'DELETE' });
      if (res.ok) {
        onSuccess();
      } else {
        const d = await res.json();
        setError(d.error || 'เกิดข้อผิดพลาดในการปิดใช้งาน');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleHardDelete = async () => {
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { method: 'DELETE' });
      if (res.ok) {
        onSuccess();
      } else {
        const d = await res.json();
        setError(d.error || 'ไม่สามารถลบรายการได้');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-surface-card rounded-2xl border-2 border-error/30 shadow-level3 max-w-lg w-full p-6 space-y-4 animate-scaleUp">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FBE9E7] text-error rounded-xl flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base md:text-lg text-onSurface">
                {hasReferences ? 'พบข้อมูลที่ยังผูกอยู่กับรายการนี้' : 'ยืนยันการลบรายการ'}
              </h3>
              <p className="text-xs text-onSurface-muted mt-0.5">
                {type === 'department' ? 'ฝ่าย:' : 'งานย่อย:'} <span className="font-bold text-onSurface">{name}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-onSurface-muted hover:text-onSurface rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {hasReferences ? (
          <div className="space-y-3 text-xs">
            <div className="p-3.5 bg-[#FBE9E7] border border-error/30 rounded-xl text-error-dark space-y-1.5">
              <p className="font-bold">⚠️ ไม่แนะนำให้ลบถาวร (Hard Delete)</p>
              <p>เนื่องจากมีข้อมูลในระบบที่อ้างอิงถึงรายการนี้อยู่ ได้แก่:</p>
              <ul className="list-disc pl-5 space-y-0.5 font-semibold">
                <li>บัญชีผู้ใช้งาน: <span className="font-bold text-error">{userCount} คน</span></li>
                <li>บทความองค์ความรู้: <span className="font-bold text-error">{knowledgeCount} รายการ</span></li>
              </ul>
              <p className="pt-1 text-[11px]">
                การลบถาวรจะทำให้ข้อมูลประวัติศาสตร์และสถิติเดิมเสียหาย ระบบขอเสนอให้เลือก <strong>"ปิดใช้งาน"</strong> เพื่อซ่อนจากแบบฟอร์มใหม่แต่ยังคงประวัติไว้
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-onSurface-muted">
            ไม่มีผู้ใช้งานหรือบทความองค์ความรู้ผูกอยู่กับรายการนี้ คุณสามารถลบรายการนี้ออกจากฐานข้อมูลได้อย่างปลอดภัย
          </p>
        )}

        {error && (
          <div className="p-2.5 bg-error-container/30 text-error rounded-xl text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-outline/20">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-onSurface-muted hover:text-onSurface"
          >
            ยกเลิก
          </button>

          {hasReferences ? (
            <button
              type="button"
              onClick={handleDeactivate}
              disabled={processing}
              className="w-full sm:w-auto px-4 py-2 bg-secondary text-secondary-dark font-bold rounded-xl text-xs hover:bg-secondary/80 flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
              <span>ปิดใช้งานแทน (แนะนำ)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleHardDelete}
              disabled={processing}
              className="w-full sm:w-auto px-4 py-2 bg-error text-white font-bold rounded-xl text-xs hover:bg-error-dark flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              <span>ยืนยันลบถาวร</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
