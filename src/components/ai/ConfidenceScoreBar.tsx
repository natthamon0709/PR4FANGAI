'use client';
import React from 'react';

interface ConfidenceScoreBarProps {
  score: number; // 0.00 - 1.00
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function getConfidenceLevel(score: number): {
  label: string;
  colorClass: string;
  bgClass: string;
  textClass: string;
  badgeBg: string;
  dotColor: string;
} {
  if (score >= 0.75) {
    return {
      label: 'ความมั่นใจสูง',
      colorClass: 'bg-[#2E7D32]',
      bgClass: 'bg-[#E8F5E9]',
      textClass: 'text-[#2E7D32]',
      badgeBg: 'bg-[#E8F5E9] text-[#2E7D32] border-[#2E7D32]/20',
      dotColor: '#2E7D32'
    };
  }
  if (score >= 0.50) {
    return {
      label: 'ความมั่นใจปานกลาง',
      colorClass: 'bg-[#8B6F2E]',
      bgClass: 'bg-[#FFF8E1]',
      textClass: 'text-[#8B6F2E]',
      badgeBg: 'bg-[#FFF8E1] text-[#8B6F2E] border-[#8B6F2E]/20',
      dotColor: '#8B6F2E'
    };
  }
  return {
    label: 'ความมั่นใจต่ำ (Fallback)',
    colorClass: 'bg-[#B3261E]',
    bgClass: 'bg-[#FBE9E7]',
    textClass: 'text-[#B3261E]',
    badgeBg: 'bg-[#FBE9E7] text-[#B3261E] border-[#B3261E]/20',
    dotColor: '#B3261E'
  };
}

export default function ConfidenceScoreBar({
  score,
  showLabel = true,
  size = 'md'
}: ConfidenceScoreBarProps) {
  const percent = Math.round(Math.max(0, Math.min(1, score)) * 100);
  const info = getConfidenceLevel(score);

  const heightClass = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';

  return (
    <div className="w-full space-y-1">
      {showLabel && (
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-onSurface-muted flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: info.dotColor }} />
            <span>{info.label}</span>
          </span>
          <span className={`font-mono font-bold ${info.textClass}`}>
            {percent}%
          </span>
        </div>
      )}
      <div className={`w-full ${heightClass} rounded-full bg-surface-variant/60 overflow-hidden`}>
        <div
          className={`h-full rounded-full ${info.colorClass} transition-all duration-500 ease-out`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
