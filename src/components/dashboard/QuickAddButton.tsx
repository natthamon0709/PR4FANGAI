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
      className={`inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-heading font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] ${className}`}
    >
      <PlusCircle className="w-4 h-4" />
      <span>{label}</span>
      <Sparkles className="w-3.5 h-3.5 text-secondary-light ml-0.5" />
    </Link>
  );
}
