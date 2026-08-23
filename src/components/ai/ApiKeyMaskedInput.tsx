'use client';
import React, { useState } from 'react';
import { Key, Eye, EyeOff, Edit2, Check } from 'lucide-react';

interface ApiKeyMaskedInputProps {
  maskedKey: string;
  onChangeKey: (newKey: string) => void;
  disabled?: boolean;
}

export default function ApiKeyMaskedInput({
  maskedKey,
  onChangeKey,
  disabled = false
}: ApiKeyMaskedInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showPlain, setShowPlain] = useState(false);

  const handleStartEdit = () => {
    setIsEditing(true);
    setInputValue('');
  };

  const handleApply = () => {
    if (inputValue.trim()) {
      onChangeKey(inputValue.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-onSurface flex items-center gap-1.5">
          <Key className="w-3.5 h-3.5 text-primary" />
          <span>API Key (กุญแจเชื่อมต่อบริการ AI)</span>
        </label>
        <span className="text-[11px] text-onSurface-muted">
          เข้ารหัสความปลอดภัย AES-256
        </span>
      </div>

      <div className="relative flex items-center">
        {isEditing ? (
          <div className="flex items-center gap-2 w-full">
            <div className="relative flex-1">
              <input
                type={showPlain ? 'text' : 'password'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="วาง API Key ใหม่ที่นี่ (เช่น AIzaSy... หรือ sk-...)"
                disabled={disabled}
                autoFocus
                className="w-full h-11 pl-3.5 pr-10 rounded-xl border-2 border-primary bg-surface text-sm text-onSurface font-mono outline-none shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPlain(!showPlain)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-onSurface-muted hover:text-onSurface p-1"
                title={showPlain ? 'ซ่อน' : 'แสดง'}
              >
                {showPlain ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="button"
              onClick={handleApply}
              className="h-11 px-4 rounded-xl bg-primary text-onPrimary font-semibold text-xs flex items-center gap-1 hover:bg-primary-hover shadow-level1 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>ยืนยัน</span>
            </button>

            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="h-11 px-3 rounded-xl border border-outline bg-surface text-xs font-semibold text-onSurface-muted hover:text-onSurface"
            >
              ยกเลิก
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full h-11 px-3.5 rounded-xl border border-outline bg-surface-variant/30 text-sm font-mono text-onSurface">
            <span className="tracking-wider">{maskedKey || '••••••••••••••••'}</span>
            {!disabled && (
              <button
                type="button"
                onClick={handleStartEdit}
                className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover px-2.5 py-1 rounded-lg hover:bg-primary-container/40 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>เปลี่ยน Key</span>
              </button>
            )}
          </div>
        )}
      </div>
      <p className="text-[11px] text-onSurface-muted">
        ระบบจะซ่อนตัวอักษรส่วนใหญ่และแสดงเฉพาะ 4 ตัวท้ายเพื่อความปลอดภัยสูงสุด
      </p>
    </div>
  );
}
