import React from 'react';
import Link from 'next/link';
import { PlusCircle, Sparkles } from 'lucide-react';

interface QuickAddButtonProps {
  href?: string;
  label?: string;
  className?: string;
}

export default function QuickAddButton({
  href = '/knowledge/new',
  label = 'เพิ่มองค์ความรู้ใหม่',
  className = '',
}: QuickAddButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 h-11 px-5 rounded-2xl bg-gradient-to-r from-primary via-[#8c0a0a] to-[#720000] hover:from-[#961212] hover:to-[#800000] text-white text-xs font-heading font-bold shadow-card hover:shadow-card-hover transition-all duration-200 active:scale-95 ring-1 ring-white/20 ${className}`}
    >
      <PlusCircle className="w-4 h-4 text-white" />
      <span>{label}</span>
      <Sparkles className="w-3.5 h-3.5 text-amber-300 ml-0.5 animate-pulse" />
    </Link>
  );
}
