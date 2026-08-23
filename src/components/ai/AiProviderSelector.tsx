'use client';
import React from 'react';
import { AiProvider } from '@/types/ai';
import { Sparkles, Cpu, Check } from 'lucide-react';

interface AiProviderSelectorProps {
  provider: AiProvider;
  modelName: string;
  onProviderChange: (p: AiProvider) => void;
  onModelChange: (m: string) => void;
  disabled?: boolean;
}

const PROVIDER_MODELS: Record<AiProvider, { id: string; name: string; tag: string; desc: string }[]> = {
  gemini: [
    { id: 'gemini-3.5-flash-lite', name: 'Gemini 3.5 Flash-Lite', tag: 'แนะนำความเร็วสูง (Recommended Fast)', desc: 'ตอบสนองรวดเร็วใน 0.8 วินาที เสถียรสูง เหมาะสำหรับ LINE OA' },
    { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', tag: 'High Intelligence', desc: 'รุ่นประมวลผลความรู้เชิงลึก สังเคราะห์ภาษาเป็นธรรมชาติ' },
    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash-Lite', tag: 'Ultra Fast', desc: 'ตอบสนองฉับไว ประหยัดโควตา API' },
    { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', tag: 'Latest Version', desc: 'เชื่อมต่อเวอร์ชันล่าสุดอัตโนมัติ' }
  ],
  openai: [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', tag: 'Fast & Efficient', desc: 'ตอบสนองไว คุ้มค่า เหมาะสำหรับคำถามทั่วไป' },
    { id: 'gpt-4o', name: 'GPT-4o', tag: 'Flagship', desc: 'ความสามารถสูงสุดในการสังเคราะห์ข้อความหลายภาษา' }
  ]
};

export default function AiProviderSelector({
  provider,
  modelName,
  onProviderChange,
  onModelChange,
  disabled = false
}: AiProviderSelectorProps) {
  const currentModels = PROVIDER_MODELS[provider] || PROVIDER_MODELS.gemini;

  return (
    <div className="space-y-4">
      {/* Provider Radio Card Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Google Gemini Card */}
        <label
          className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
            provider === 'gemini'
              ? 'border-primary bg-primary-container/20 shadow-level1'
              : 'border-outline/30 bg-surface-card hover:border-outline/60'
          } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input
            type="radio"
            name="ai_provider"
            value="gemini"
            checked={provider === 'gemini'}
            onChange={() => {
              onProviderChange('gemini');
              onModelChange('gemini-1.5-flash');
            }}
            className="sr-only"
            disabled={disabled}
          />
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-sm text-onSurface">Google Gemini</span>
              {provider === 'gemini' && <Check className="w-4 h-4 text-primary" />}
            </div>
            <p className="text-xs text-onSurface-muted mt-0.5">
              บริการ AI แนะนำสำหรับวิทยาลัยการอาชีพฝาง (คุ้มค่า รวดเร็ว)
            </p>
          </div>
        </label>

        {/* OpenAI GPT Card */}
        <label
          className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
            provider === 'openai'
              ? 'border-primary bg-primary-container/20 shadow-level1'
              : 'border-outline/30 bg-surface-card hover:border-outline/60'
          } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        >
          <input
            type="radio"
            name="ai_provider"
            value="openai"
            checked={provider === 'openai'}
            onChange={() => {
              onProviderChange('openai');
              onModelChange('gpt-4o-mini');
            }}
            className="sr-only"
            disabled={disabled}
          />
          <div className="w-9 h-9 rounded-xl bg-[#10A37F]/10 border border-[#10A37F]/20 flex items-center justify-center text-[#10A37F] flex-shrink-0">
            <Cpu className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-heading font-bold text-sm text-onSurface">OpenAI GPT</span>
              {provider === 'openai' && <Check className="w-4 h-4 text-primary" />}
            </div>
            <p className="text-xs text-onSurface-muted mt-0.5">
              สลับใช้โมเดลตระกูล GPT-4o ของ OpenAI
            </p>
          </div>
        </label>
      </div>

      {/* Model Selection Dropdown */}
      <div>
        <label className="block text-xs font-semibold text-onSurface mb-1.5">
          รุ่นของโมเดล (AI Model Selection) <span className="text-error">*</span>
        </label>
        <select
          value={modelName}
          onChange={(e) => onModelChange(e.target.value)}
          disabled={disabled}
          className="w-full h-11 px-3.5 rounded-xl border border-outline bg-surface text-sm text-onSurface outline-none focus:border-primary focus:ring-1 focus:ring-primary font-mono cursor-pointer transition-all"
        >
          {currentModels.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} — [{m.tag}]
            </option>
          ))}
        </select>
        <p className="text-[11px] text-onSurface-muted mt-1">
          {currentModels.find(m => m.id === modelName)?.desc || 'เลือกรุ่นโมเดลที่ต้องการประมวลผลคำตอบ'}
        </p>
      </div>
    </div>
  );
}
