'use client';
import React, { useState } from 'react';
import { Plus, X, Mail } from 'lucide-react';

interface RecipientPickerProps {
  recipients: string[];
  onChange: (recipients: string[]) => void;
}

export default function RecipientPicker({ recipients, onChange }: RecipientPickerProps) {
  const [inputEmail, setInputEmail] = useState('');

  const quickRecipients = [
    { label: 'ผู้อำนวยการ', email: 'director@fang.ac.th' },
    { label: 'ฝ่ายวิชาการ', email: 'academic@fang.ac.th' },
    { label: 'ฝ่ายบริหารทรัพยากร', email: 'resource@fang.ac.th' },
    { label: 'ฝ่ายพัฒนากิจการฯ', email: 'student_affairs@fang.ac.th' }
  ];

  const handleAddEmail = () => {
    const trimmed = inputEmail.trim().toLowerCase();
    if (trimmed && !recipients.includes(trimmed)) {
      onChange([...recipients, trimmed]);
      setInputEmail('');
    }
  };

  const handleRemove = (email: string) => {
    onChange(recipients.filter(r => r !== email));
  };

  const handleAddQuick = (email: string) => {
    if (!recipients.includes(email)) {
      onChange([...recipients, email]);
    }
  };

  return (
    <div className="space-y-3">
      {/* Quick Picks */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-onSurface-muted">แนะนำผู้บริหาร:</span>
        {quickRecipients.map((q) => (
          <button
            key={q.email}
            type="button"
            onClick={() => handleAddQuick(q.email)}
            className="text-[11px] px-2 py-0.5 rounded-full bg-surface border border-outline/30 hover:border-primary text-onSurface-muted hover:text-primary transition-colors"
          >
            + {q.label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Mail className="w-4 h-4 text-onSurface-muted absolute left-3 top-2.5" />
          <input
            type="email"
            value={inputEmail}
            onChange={(e) => setInputEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddEmail(); } }}
            placeholder="ระบุอีเมลผู้รับรายงาน เช่น user@fang.ac.th"
            className="w-full pl-9 pr-3 py-2 text-xs bg-surface border border-outline/30 rounded-xl focus:outline-none focus:border-primary"
          />
        </div>
        <button
          type="button"
          onClick={handleAddEmail}
          className="px-3 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary-dark flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>เพิ่ม</span>
        </button>
      </div>

      {/* Recipient Tags */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {recipients.map((email) => (
          <span
            key={email}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-container/40 text-primary text-xs font-medium border border-primary/20"
          >
            <span>{email}</span>
            <button
              type="button"
              onClick={() => handleRemove(email)}
              className="text-primary hover:text-error transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
