'use client';
import React from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';

interface ConflictAlertBannerProps {
  conflictCount: number;
  onOpenModal: () => void;
}

export default function ConflictAlertBanner({
  conflictCount,
  onOpenModal,
}: ConflictAlertBannerProps) {
  if (conflictCount <= 0) return null;

  return (
    <div className="p-4 rounded-2xl bg-[#EDE7F6] border border-[#6750A4]/30 shadow-level1 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#6750A4] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs sm:text-sm font-heading font-bold text-[#381E72]">
            ⚠️ พบข้อมูลขัดแย้ง {conflictCount} รายการ ที่ต้องตรวจสอบและตัดสินใจ
          </h4>
          <p className="text-xs text-[#49454F] mt-0.5">
            มีการแก้ไขข้อมูลแถวเดียวกันจากฝั่งเว็บระบบและฝั่ง Google Sheet ในช่วงเวลาเดียวกัน
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onOpenModal}
        className="self-start sm:self-center px-4 py-2 rounded-xl bg-[#6750A4] hover:bg-[#533E85] text-white text-xs font-heading font-bold flex items-center gap-1.5 shadow-sm transition-all"
      >
        <span>ไปที่หน้าแก้ไขข้อขัดแย้ง</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
