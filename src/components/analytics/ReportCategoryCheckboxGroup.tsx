'use client';
import React from 'react';
import { Users, BookOpen, Bot, Smartphone, Check } from 'lucide-react';

interface ReportCategoryCheckboxGroupProps {
  selectedCategories: ('usage' | 'knowledge' | 'ai' | 'line')[];
  onChange: (categories: ('usage' | 'knowledge' | 'ai' | 'line')[]) => void;
}

export default function ReportCategoryCheckboxGroup({
  selectedCategories,
  onChange
}: ReportCategoryCheckboxGroupProps) {
  const categories = [
    { id: 'usage', label: 'การใช้งานระบบ (Usage)', desc: 'สถิติ Login, ผู้ใช้ Active และการซิงค์', icon: Users },
    { id: 'knowledge', label: 'ประสิทธิภาพองค์ความรู้', desc: 'การเติบโตของ KM และบทความยอดนิยม', icon: BookOpen },
    { id: 'ai', label: 'ประสิทธิภาพ AI (RAG)', desc: 'อัตราความสำเร็จ, Latency และ Knowledge Gaps', icon: Bot },
    { id: 'line', label: 'LINE Official Account', desc: 'ยอดผู้ติดตาม, บรอดแคสต์ และการผูกบัญชี', icon: Smartphone }
  ];

  const toggle = (id: 'usage' | 'knowledge' | 'ai' | 'line') => {
    if (selectedCategories.includes(id)) {
      if (selectedCategories.length === 1) return; // Must select at least 1
      onChange(selectedCategories.filter(c => c !== id));
    } else {
      onChange([...selectedCategories, id]);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {categories.map((cat) => {
        const isSelected = selectedCategories.includes(cat.id as any);
        const Icon = cat.icon;
        return (
          <div
            key={cat.id}
            onClick={() => toggle(cat.id as any)}
            className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 select-none ${
              isSelected
                ? 'border-primary bg-primary-container/20 text-onSurface'
                : 'border-outline/30 bg-surface-card hover:border-outline/60 text-onSurface-muted'
            }`}
          >
            <div className={`p-2 rounded-lg flex-shrink-0 ${isSelected ? 'bg-primary text-white' : 'bg-surface text-onSurface-muted'}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs md:text-sm font-bold text-onSurface">{cat.label}</p>
                <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                  isSelected ? 'bg-primary border-primary text-white' : 'border-outline/40 bg-surface'
                }`}>
                  {isSelected && <Check className="w-3 h-3" />}
                </div>
              </div>
              <p className="text-[11px] text-onSurface-muted mt-0.5">{cat.desc}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
