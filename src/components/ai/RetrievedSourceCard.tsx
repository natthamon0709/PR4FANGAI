'use client';
import React from 'react';
import Link from 'next/link';
import { BookOpen, Newspaper, Megaphone, HelpCircle, FileText, ExternalLink } from 'lucide-react';

interface RetrievedSourceCardProps {
  knowledgeId: string;
  title: string;
  contentType: string;
  departmentName?: string;
  relevanceScore: number; // 0.00 - 1.00
  rank?: number;
}

const TYPE_ICONS: Record<string, any> = {
  regulation: BookOpen,
  manual: FileText,
  news: Newspaper,
  announcement: Megaphone,
  faq: HelpCircle,
  document: FileText,
};

export default function RetrievedSourceCard({
  knowledgeId,
  title,
  contentType,
  departmentName,
  relevanceScore,
  rank
}: RetrievedSourceCardProps) {
  const Icon = TYPE_ICONS[contentType] || FileText;
  const percent = Math.round(relevanceScore * 100);

  return (
    <Link
      href={`/knowledge/${knowledgeId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-surface-variant hover:bg-primary-container/60 border border-outline/30 text-xs text-onSurface hover:text-primary transition-all duration-150 group shadow-sm hover:shadow"
      title={`${title} (${departmentName || 'วิทยาลัยการอาชีพฝาง'}) — ความเกี่ยวข้อง ${percent}%`}
    >
      <Icon className="w-3.5 h-3.5 text-primary/80 group-hover:text-primary flex-shrink-0" />
      <span className="max-w-[140px] sm:max-w-[200px] truncate font-medium">
        {rank ? `${rank}. ` : ''}{title}
      </span>
      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface text-primary border border-outline/20">
        {percent}%
      </span>
      <ExternalLink className="w-3 h-3 text-onSurface-muted group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  );
}
