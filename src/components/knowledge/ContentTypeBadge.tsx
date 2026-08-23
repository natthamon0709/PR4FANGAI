import React from 'react';
import { ContentType } from '@/types/knowledge';
import { 
  Newspaper, 
  Megaphone, 
  HelpCircle, 
  FileText, 
  BookOpen, 
  Scale, 
  Receipt, 
  GitFork 
} from 'lucide-react';

interface ContentTypeBadgeProps {
  type: ContentType;
  showIcon?: boolean;
  className?: string;
}

export const CONTENT_TYPE_CONFIG: Record<ContentType, {
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  news: {
    label: 'ข่าวประชาสัมพันธ์',
    icon: Newspaper,
    color: 'text-[#2C6E80]',
    bgColor: 'bg-[#E5F1F4]',
    borderColor: 'border-[#4A90A4]/30',
  },
  announcement: {
    label: 'ประกาศ',
    icon: Megaphone,
    color: 'text-[#D97706]',
    bgColor: 'bg-[#FEF3C7]',
    borderColor: 'border-[#D97706]/30',
  },
  faq: {
    label: 'FAQ',
    icon: HelpCircle,
    color: 'text-[#800000]',
    bgColor: 'bg-[#FDF2F2]',
    borderColor: 'border-[#800000]/30',
  },
  document: {
    label: 'เอกสาร',
    icon: FileText,
    color: 'text-[#5B5851]',
    bgColor: 'bg-[#EDEAE3]',
    borderColor: 'border-[#5B5851]/30',
  },
  manual: {
    label: 'คู่มือ',
    icon: BookOpen,
    color: 'text-[#3F5FA0]',
    bgColor: 'bg-[#E4E9F5]',
    borderColor: 'border-[#3F5FA0]/30',
  },
  regulation: {
    label: 'ระเบียบ',
    icon: Scale,
    color: 'text-[#B3261E]',
    bgColor: 'bg-[#FBE9E7]',
    borderColor: 'border-[#B3261E]/30',
  },
  form: {
    label: 'แบบฟอร์ม',
    icon: Receipt,
    color: 'text-[#6B5B95]',
    bgColor: 'bg-[#EDE7F3]',
    borderColor: 'border-[#6B5B95]/30',
  },
  service_process: {
    label: 'ขั้นตอนการให้บริการ',
    icon: GitFork,
    color: 'text-[#2E7D32]',
    bgColor: 'bg-[#E4F2E4]',
    borderColor: 'border-[#2E7D32]/30',
  },
};

export default function ContentTypeBadge({
  type,
  showIcon = true,
  className = '',
}: ContentTypeBadgeProps) {
  const config = CONTENT_TYPE_CONFIG[type] || CONTENT_TYPE_CONFIG.document;
  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${config.bgColor} ${config.color} ${config.borderColor} ${className}`}
    >
      {showIcon && <IconComponent className="w-3 h-3 flex-shrink-0" />}
      <span>{config.label}</span>
    </span>
  );
}
