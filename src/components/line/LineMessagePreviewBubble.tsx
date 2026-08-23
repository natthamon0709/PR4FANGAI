'use client';
import React from 'react';
import { Send, Sparkles } from 'lucide-react';

interface LineMessagePreviewBubbleProps {
  title: string;
  messageText: string;
}

export default function LineMessagePreviewBubble({
  title,
  messageText
}: LineMessagePreviewBubbleProps) {
  return (
    <div className="p-4 rounded-3xl bg-[#E9E5DC] border border-outline/30 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-gray-700 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00B900]" />
          <span>ตัวอย่างข้อความจริงบนแอป LINE (Bubble Preview)</span>
        </span>
        <span className="text-[10px] font-mono text-gray-500">
          วิทยาลัยการอาชีพฝาง
        </span>
      </div>

      {/* LINE Bubble Container */}
      <div className="flex items-start gap-2 max-w-[92%]">
        <div className="w-8 h-8 rounded-full bg-[#00B900] text-white font-extrabold text-[11px] flex items-center justify-center shadow-sm flex-shrink-0">
          FVE
        </div>

        <div className="p-3.5 rounded-2xl rounded-tl-none bg-white text-gray-900 shadow-sm border border-[#00B900]/30 space-y-1.5 text-xs leading-relaxed">
          {title && (
            <h4 className="font-bold text-sm text-[#00B900] pb-1 border-b border-gray-100">
              {title}
            </h4>
          )}
          <p className="whitespace-pre-wrap text-gray-800 text-[11px] sm:text-xs">
            {messageText || 'พิมพ์ข้อความเพื่อดูตัวอย่างบน LINE...'}
          </p>
        </div>
      </div>
    </div>
  );
}
