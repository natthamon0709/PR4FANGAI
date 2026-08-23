'use client';
import React, { useState } from 'react';
import { Copy, Check, Link as LinkIcon, ShieldCheck, AlertCircle, Edit3, Globe } from 'lucide-react';

interface WebhookUrlFieldProps {
  url: string;
  onChange?: (newUrl: string) => void;
  verified?: boolean;
  disabled?: boolean;
}

export default function WebhookUrlField({
  url,
  onChange,
  verified = false,
  disabled = false
}: WebhookUrlFieldProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isEditable = Boolean(onChange);

  return (
    <div className="p-4 md:p-5 rounded-3xl bg-surface-card border border-outline/30 shadow-level1 space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="text-xs font-bold text-onSurface flex items-center gap-1.5">
          <Globe className="w-4 h-4 text-primary" />
          <span>Webhook URL สำหรับ LINE Developers Console</span>
          {isEditable && (
            <span className="text-[10px] text-onSurface-muted font-normal flex items-center gap-1">
              <Edit3 className="w-3 h-3 text-primary" /> (สามารถแก้ไข URL ได้)
            </span>
          )}
        </label>

        {verified ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-[#2E7D32] font-semibold bg-[#E8F5E9] px-2.5 py-0.5 rounded-full border border-[#2E7D32]/30 w-fit">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>เชื่อมต่อสำเร็จ (Webhook Verified)</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[11px] text-[#8B6F2E] font-semibold bg-[#FFF8E1] px-2.5 py-0.5 rounded-full border border-[#8B6F2E]/30 w-fit">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>ยังไม่ได้ทดสอบเชื่อมต่อ (Unverified)</span>
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <input
          type="text"
          value={url}
          onChange={(e) => onChange?.(e.target.value)}
          readOnly={!isEditable}
          disabled={disabled}
          placeholder="https://xxxx.ngrok-free.app/api/line-oa/webhook หรือ https://your-domain.com/api/line-oa/webhook"
          className={`flex-1 h-11 px-3.5 rounded-2xl border text-xs font-mono outline-none transition-all ${
            isEditable
              ? 'bg-surface text-onSurface border-outline focus:border-primary focus:ring-1 focus:ring-primary'
              : 'bg-surface-variant/40 text-onSurface border-outline/40 cursor-default select-all'
          }`}
        />

        <button
          type="button"
          onClick={handleCopy}
          className={`h-11 px-4 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm flex-shrink-0 ${
            copied
              ? 'bg-[#E8F5E9] text-[#2E7D32] border border-[#2E7D32]/30'
              : 'bg-primary text-onPrimary hover:bg-primary-hover'
          }`}
        >
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก Webhook URL'}</span>
        </button>
      </div>

      <div className="text-[11px] text-onSurface-muted space-y-1">
        <p>• <strong>วิธีใช้งาน:</strong> นำ URL นี้ไปกรอกในช่อง <strong>Webhook URL</strong> ในแท็บ Messaging API บน LINE Developers Console</p>
        <p>• <strong>การทดสอบด้วย ngrok:</strong> หากรันบนเครื่อง Local ให้รัน <code className="bg-surface-variant/60 px-1 py-0.5 rounded font-mono text-[10px]">ngrok http 3000</code> แล้วนำ HTTPS URL ที่ได้มาใส่แทนที่ด้านบนนี้</p>
      </div>
    </div>
  );
}
