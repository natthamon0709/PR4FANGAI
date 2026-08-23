'use client';
import React from 'react';
import { Bot, ChevronDown, MessageSquare, Send } from 'lucide-react';
import { LineTapArea } from '@/types/line';

interface RichMenuMobilePreviewProps {
  imageUrl: string;
  chatBarText?: string;
  tapAreas: LineTapArea[];
  selectedAreaId?: string | null;
  onSelectArea?: (areaId: string) => void;
  showTapGrid?: boolean;
}

export default function RichMenuMobilePreview({
  imageUrl,
  chatBarText = 'เมนูหลัก',
  tapAreas,
  selectedAreaId,
  onSelectArea,
  showTapGrid = true
}: RichMenuMobilePreviewProps) {
  return (
    <div className="flex flex-col items-center justify-center p-2">
      {/* Mobile Device Mockup (320x640px) */}
      <div className="relative w-[320px] h-[640px] rounded-[40px] bg-[#1a1a1a] p-3 shadow-2xl border-4 border-[#2d2d2d] flex flex-col overflow-hidden">
        {/* Device Notch */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-4 bg-[#111] rounded-full z-30 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-[#222] mr-3" />
          <div className="w-2 h-2 rounded-full bg-[#1a1a1a]" />
        </div>

        {/* Screen Container */}
        <div className="flex-1 rounded-[32px] bg-[#E9E5DC] flex flex-col overflow-hidden relative">
          {/* LINE Header */}
          <div className="pt-8 pb-3 px-4 bg-[#232F3E] text-white flex items-center justify-between shadow-sm z-20">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary font-bold text-xs shadow-sm">
                FVE
              </div>
              <div>
                <h4 className="font-semibold text-xs text-white">วิทยาลัยการอาชีพฝาง</h4>
                <span className="text-[10px] text-gray-300 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00B900]" />
                  <span>Official Account</span>
                </span>
              </div>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
            <div className="text-center">
              <span className="px-2.5 py-0.5 rounded-full bg-black/10 text-[10px] text-gray-600 font-mono">
                วันนี้
              </span>
            </div>

            <div className="flex items-start gap-2 max-w-[85%]">
              <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-primary text-[10px] shadow-sm flex-shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="p-2.5 rounded-2xl rounded-tl-none bg-white text-gray-800 shadow-sm border border-gray-200 text-[11px] leading-relaxed">
                สวัสดีครับ ยินดีต้อนรับสู่ LINE OA วิทยาลัยการอาชีพฝาง ท่านสามารถเลือกเมนูด้านล่างหรือพิมพ์คำถามได้เลยครับ
              </div>
            </div>
          </div>

          {/* Rich Menu Area at Bottom */}
          <div className="relative w-full bg-white border-t border-gray-300 shadow-level2 z-20">
            {/* Rich Menu Image & Interactive Tap Overlays */}
            <div className="relative w-full h-[180px] bg-gray-100 overflow-hidden select-none">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Rich Menu"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                  onLoad={(e) => {
                    (e.target as HTMLImageElement).style.display = 'block';
                    const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'none';
                  }}
                />
              ) : null}
              <div
                style={{ display: imageUrl ? 'none' : 'flex' }}
                className="w-full h-full flex-col items-center justify-center text-gray-500 p-3 text-center bg-gray-200"
              >
                <span className="text-[11px] font-bold text-error">⚠️ รูปภาพไม่แสดง / ลิงก์ติดการป้องกัน</span>
                <span className="text-[9px] text-gray-500 mt-1">แนะนำให้กดปุ่ม "📁 อัปโหลดรูปภาพจากเครื่อง" ด้านขวาเพื่ออัปโหลดตรง</span>
              </div>

              {/* Tap Area Grid Overlays */}
              {showTapGrid && tapAreas.map((area, idx) => {
                const isSelected = selectedAreaId === area.id;
                // Calculate percentage relative to 2500x1686 (or standardized coordinates)
                const left = (area.bounds.x / 2500) * 100;
                const top = (area.bounds.y / 1686) * 100;
                const width = (area.bounds.width / 2500) * 100;
                const height = (area.bounds.height / 1686) * 100;

                return (
                  <div
                    key={area.id || idx}
                    onClick={() => onSelectArea?.(area.id)}
                    style={{
                      left: `${left}%`,
                      top: `${top}%`,
                      width: `${width}%`,
                      height: `${height}%`
                    }}
                    className={`absolute cursor-pointer transition-all flex flex-col items-center justify-center p-1 ${
                      isSelected
                        ? 'bg-[#00B900]/40 border-2 border-[#00B900] shadow-md z-30'
                        : 'bg-black/20 hover:bg-black/30 border border-white/60 z-20'
                    }`}
                  >
                    <span className="px-1.5 py-0.5 rounded bg-black/70 text-white font-bold text-[9px] truncate max-w-full">
                      {idx + 1}. {area.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Chat Bar Toggle */}
            <div className="h-8 px-4 bg-[#F2F2F2] border-t border-gray-200 flex items-center justify-between text-xs text-gray-700 font-medium">
              <span className="flex items-center gap-1">
                <span>{chatBarText}</span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
              </span>
              <div className="flex items-center gap-2 text-gray-400">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
