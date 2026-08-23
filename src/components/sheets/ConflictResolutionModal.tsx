'use client';
import React, { useState } from 'react';
import { SyncConflictItem } from '@/types/sheets';
import { AlertTriangle, X, CheckCircle2, ShieldAlert, User, Clock, Loader2 } from 'lucide-react';

interface ConflictResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflict: SyncConflictItem | null;
  onResolve: (conflictId: string, choice: 'use_db' | 'use_sheet') => Promise<void>;
}

export default function ConflictResolutionModal({
  isOpen,
  onClose,
  conflict,
  onResolve,
}: ConflictResolutionModalProps) {
  const [selectedChoice, setSelectedChoice] = useState<'use_db' | 'use_sheet'>('use_db');
  const [resolving, setResolving] = useState(false);

  if (!isOpen || !conflict) return null;

  const dbVal = conflict.db_value || {};
  const sheetVal = conflict.sheet_value || {};

  const handleConfirm = async () => {
    setResolving(true);
    try {
      await onResolve(conflict.conflict_id, selectedChoice);
      onClose();
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-surface-card rounded-2xl border border-outline/30 shadow-level3 p-5 sm:p-6 space-y-4 animate-scaleUp overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-outline/20">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#6750A4] text-white flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-heading font-bold text-onSurface">
                แก้ไขข้อมูลขัดแย้ง (Conflict Resolution)
              </h3>
              <p className="text-xs text-onSurface-muted">
                แท็บ: <strong className="text-onSurface font-mono">{conflict.sheet_name}</strong> · รายการ: {conflict.record_title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-onSurface-muted hover:bg-surface-variant transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Subtitle Warning */}
        <p className="text-xs text-onSurface-muted leading-relaxed">
          ระบบตรวจพบว่าข้อมูลรายการนี้ถูกแก้ไขพร้อมกันจากทั้งฝั่งหน้าเว็บระบบและฝั่ง Google Sheet โปรดเลือกค่าที่ต้องการให้เป็น <strong>Single Source of Truth</strong> ที่ถูกต้อง:
        </p>

        {/* 2-Column Side-by-Side Comparison (Style Guide 15) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-1 py-1">
          {/* Column 1: Current Database Value */}
          <div
            onClick={() => setSelectedChoice('use_db')}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
              selectedChoice === 'use_db'
                ? 'bg-primary-container/20 border-primary shadow-sm ring-2 ring-primary/20'
                : 'bg-surface border-outline/30 hover:border-outline'
            }`}
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-heading font-bold text-primary flex items-center gap-1.5">
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedChoice === 'use_db' ? 'border-primary bg-primary text-white' : 'border-outline'}`}>
                    {selectedChoice === 'use_db' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  <span>ค่าปัจจุบันในระบบ (Web App)</span>
                </span>
                <span className="px-2 py-0.2 rounded-full bg-surface-variant text-[10px] text-onSurface-muted font-mono">
                  Database
                </span>
              </div>

              <div className="text-[11px] text-onSurface-muted space-y-1">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 text-onSurface-muted/70" />
                  <span>ผู้แก้ไข: <strong>{dbVal.updated_by_name || 'เจ้าหน้าที่ (ผ่านเว็บ)'}</strong></span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-card border border-outline/20 space-y-2 text-xs">
                {dbVal.title && (
                  <div>
                    <span className="text-[10px] text-onSurface-muted block">หัวข้อ:</span>
                    <p className="font-semibold text-onSurface">{dbVal.title}</p>
                  </div>
                )}
                {dbVal.summary && (
                  <div>
                    <span className="text-[10px] text-onSurface-muted block">สรุปย่อ:</span>
                    <p className="text-onSurface leading-relaxed">{dbVal.summary}</p>
                  </div>
                )}
                {dbVal.phone && (
                  <div>
                    <span className="text-[10px] text-onSurface-muted block">เบอร์โทรศัพท์:</span>
                    <p className="font-mono font-bold text-onSurface">{dbVal.phone}</p>
                  </div>
                )}
                {dbVal.content && (
                  <div>
                    <span className="text-[10px] text-onSurface-muted block">เนื้อหา:</span>
                    <p className="font-mono text-[11px] text-onSurface max-h-24 overflow-y-auto leading-relaxed">{dbVal.content}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 text-center text-xs font-semibold text-primary">
              {selectedChoice === 'use_db' ? '✓ เลือกใช้ค่านี้' : 'คลิกเพื่อเลือก'}
            </div>
          </div>

          {/* Column 2: Google Sheet Value */}
          <div
            onClick={() => setSelectedChoice('use_sheet')}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between space-y-3 ${
              selectedChoice === 'use_sheet'
                ? 'bg-secondary-container/30 border-secondary-dark shadow-sm ring-2 ring-secondary/20'
                : 'bg-surface border-outline/30 hover:border-outline'
            }`}
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-heading font-bold text-secondary-dark flex items-center gap-1.5">
                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedChoice === 'use_sheet' ? 'border-secondary-dark bg-secondary-dark text-white' : 'border-outline'}`}>
                    {selectedChoice === 'use_sheet' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  <span>ค่าที่แก้ไขใน Google Sheet</span>
                </span>
                <span className="px-2 py-0.2 rounded-full bg-[#E5F4EA] text-[#0F9D58] text-[10px] font-bold font-mono">
                  Google Sheet
                </span>
              </div>

              <div className="text-[11px] text-onSurface-muted space-y-1">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3 text-onSurface-muted/70" />
                  <span>ผู้แก้ไข: <strong>{sheetVal.updated_by_name || 'เจ้าหน้าที่ (ผ่าน Sheet)'}</strong></span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-surface-card border border-outline/20 space-y-2 text-xs">
                {sheetVal.title && (
                  <div>
                    <span className="text-[10px] text-onSurface-muted block">หัวข้อ:</span>
                    <p className="font-semibold text-onSurface">{sheetVal.title}</p>
                  </div>
                )}
                {sheetVal.summary && (
                  <div>
                    <span className="text-[10px] text-onSurface-muted block">สรุปย่อ:</span>
                    <p className="text-onSurface leading-relaxed">{sheetVal.summary}</p>
                  </div>
                )}
                {sheetVal.phone && (
                  <div>
                    <span className="text-[10px] text-onSurface-muted block">เบอร์โทรศัพท์:</span>
                    <p className="font-mono font-bold text-onSurface">{sheetVal.phone}</p>
                  </div>
                )}
                {sheetVal.content && (
                  <div>
                    <span className="text-[10px] text-onSurface-muted block">เนื้อหา:</span>
                    <p className="font-mono text-[11px] text-onSurface max-h-24 overflow-y-auto leading-relaxed">{sheetVal.content}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 text-center text-xs font-semibold text-secondary-dark">
              {selectedChoice === 'use_sheet' ? '✓ เลือกใช้ค่านี้' : 'คลิกเพื่อเลือก'}
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-outline/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-outline text-xs font-medium text-onSurface hover:bg-surface-variant transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={resolving}
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-heading font-bold flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
          >
            {resolving && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>ยืนยันการแก้ไขข้อขัดแย้ง</span>
          </button>
        </div>
      </div>
    </div>
  );
}
