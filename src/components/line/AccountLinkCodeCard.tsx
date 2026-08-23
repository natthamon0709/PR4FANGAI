'use client';
import React, { useState, useEffect } from 'react';
import { Smartphone, RefreshCw, CheckCircle2, Clock, Loader2, ArrowRight } from 'lucide-react';
import { AccountLinkRequest } from '@/types/line';

interface AccountLinkCodeCardProps {
  currentLineUserId?: string | null;
  onLinkSuccess?: () => void;
}

export default function AccountLinkCodeCard({
  currentLineUserId,
  onLinkSuccess
}: AccountLinkCodeCardProps) {
  const [request, setRequest] = useState<AccountLinkRequest | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [loading, setLoading] = useState(false);

  const generateCode = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/line-oa/account-link', { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.request) {
        setRequest(data.request);
        setTimeLeft(600);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentLineUserId && !request) {
      generateCode();
    }
  }, [currentLineUserId]);

  useEffect(() => {
    if (timeLeft <= 0 || !request) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [request]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  if (currentLineUserId) {
    return (
      <div className="p-5 rounded-3xl bg-[#E8F5E9]/60 border border-[#2E7D32]/30 shadow-level1 flex items-start gap-4">
        <div className="w-10 h-10 rounded-2xl bg-[#00B900]/20 flex items-center justify-center text-[#00B900] flex-shrink-0">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="font-heading font-bold text-sm text-[#2E7D32]">
            ผูกบัญชี LINE Official Account สำเร็จแล้ว
          </h4>
          <p className="text-xs text-onSurface-muted font-mono">
            LINE User ID: {currentLineUserId}
          </p>
          <p className="text-[11px] text-onSurface-muted pt-1">
            ท่านจะได้รับการแจ้งเตือนงานและคำร้องที่เกี่ยวข้องกับฝ่ายงานของท่านผ่านทาง LINE โดยอัตโนมัติ
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-3xl bg-surface-card border border-outline/30 shadow-level2 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#00B900]/10 flex items-center justify-center text-[#00B900]">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-heading font-bold text-sm text-onSurface">
              ผูกบัญชี LINE เพื่อรับการแจ้งเตือนงาน (Account Linking)
            </h4>
            <p className="text-[11px] text-onSurface-muted">
              พิมพ์รหัส 6 หลักด้านล่างนี้ ส่งในแชท LINE Official Account ของวิทยาลัย
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={generateCode}
          disabled={loading}
          className="p-2 rounded-xl text-onSurface-muted hover:text-onSurface hover:bg-surface-variant transition-colors"
          title="ขอรหัสใหม่"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
        </button>
      </div>

      {/* 6-Digit Code Display */}
      {request && timeLeft > 0 ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#00B900]/5 border-2 border-[#00B900]/30">
          <div className="text-center sm:text-left">
            <span className="text-[10px] text-onSurface-muted uppercase tracking-wider block font-semibold">
              รหัสยืนยัน 6 หลักของคุณ:
            </span>
            <div className="font-mono text-3xl font-extrabold text-[#00B900] tracking-widest mt-0.5">
              {request.verification_code}
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs font-mono text-onSurface-muted bg-surface px-3 py-1.5 rounded-xl border border-outline/20">
            <Clock className="w-4 h-4 text-[#8B6F2E]" />
            <span>หมดอายุใน: </span>
            <strong className="text-onSurface">{minutes}:{seconds.toString().padStart(2, '0')}</strong>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-[#FBE9E7] text-[#B3261E] text-xs font-medium text-center space-y-2">
          <p>รหัสยืนยันหมดอายุแล้ว</p>
          <button
            type="button"
            onClick={generateCode}
            className="px-3 py-1.5 rounded-xl bg-primary text-onPrimary text-xs font-semibold"
          >
            สร้างรหัสยืนยันใหม่
          </button>
        </div>
      )}

      {/* Steps Guide */}
      <div className="space-y-1.5 text-xs text-onSurface-muted border-t border-outline/15 pt-3">
        <strong className="text-onSurface block mb-1 font-semibold">ขั้นตอนการผูกบัญชี:</strong>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center">1</span>
          <span>เพิ่มเพื่อน LINE OA ของวิทยาลัยการอาชีพฝาง (สแกน QR Code หรือค้นหา @fang.ac.th)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary font-bold text-[10px] flex items-center justify-center">2</span>
          <span>พิมพ์รหัสยืนยัน 6 หลักข้างต้นลงในช่องแชทแล้วกดส่ง</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[#00B900]/20 text-[#00B900] font-bold text-[10px] flex items-center justify-center">3</span>
          <span>ระบบจะตอบกลับยืนยันการผูกบัญชีสำเร็จทันที</span>
        </div>
      </div>
    </div>
  );
}
