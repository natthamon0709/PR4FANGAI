'use client';
import React, { useState } from 'react';
import { 
  Bold, 
  Italic, 
  Heading1, 
  Heading2, 
  List, 
  ListOrdered, 
  Link as LinkIcon, 
  Code, 
  Eye, 
  Edit3 
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export default function RichTextEditor({
  value = '',
  onChange,
  placeholder = 'พิมพ์เนื้อหาองค์ความรู้ที่นี่ (รองรับ Markdown)...',
  minHeight = 'min-h-[260px]',
}: RichTextEditorProps) {
  const [isPreview, setIsPreview] = useState(false);

  const insertFormatting = (prefix: string, suffix: string = '') => {
    const textarea = document.getElementById('rich-text-area') as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end);
    const replacement = prefix + (selected || 'ข้อความ') + suffix;
    const newValue = value.substring(0, start) + replacement + value.substring(end);

    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 6));
    }, 50);
  };

  return (
    <div className="rounded-xl border border-outline bg-surface-card overflow-hidden focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
      {/* Toolbar (Style Guide 15: 44px height, Surface Variant background) */}
      <div className="h-11 px-3 bg-surface-variant/70 border-b border-outline/30 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => insertFormatting('**', '**')}
            className="p-1.5 rounded hover:bg-surface-card text-onSurface-variant hover:text-onSurface transition-colors"
            title="ตัวหนา (Bold)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('*', '*')}
            className="p-1.5 rounded hover:bg-surface-card text-onSurface-variant hover:text-onSurface transition-colors"
            title="ตัวเอียง (Italic)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-outline/40 mx-1" />
          <button
            type="button"
            onClick={() => insertFormatting('## ', '')}
            className="p-1.5 rounded hover:bg-surface-card text-onSurface-variant hover:text-onSurface transition-colors"
            title="หัวข้อใหญ่ (H1)"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('### ', '')}
            className="p-1.5 rounded hover:bg-surface-card text-onSurface-variant hover:text-onSurface transition-colors"
            title="หัวข้อย่อย (H2)"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <div className="w-[1px] h-4 bg-outline/40 mx-1" />
          <button
            type="button"
            onClick={() => insertFormatting('- ', '')}
            className="p-1.5 rounded hover:bg-surface-card text-onSurface-variant hover:text-onSurface transition-colors"
            title="รายการแบบจุด (Bullet List)"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('1. ', '')}
            className="p-1.5 rounded hover:bg-surface-card text-onSurface-variant hover:text-onSurface transition-colors"
            title="รายการแบบตัวเลข (Numbered List)"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('[ชื่อลิงก์](', ')')}
            className="p-1.5 rounded hover:bg-surface-card text-onSurface-variant hover:text-onSurface transition-colors"
            title="แทรกลิงก์ (Link)"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('```\n', '\n```')}
            className="p-1.5 rounded hover:bg-surface-card text-onSurface-variant hover:text-onSurface transition-colors"
            title="โค้ด / บล็อกข้อความ"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>

        {/* Preview toggle */}
        <button
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
            isPreview ? 'bg-primary text-white' : 'text-onSurface-muted hover:bg-surface-card'
          }`}
        >
          {isPreview ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          <span>{isPreview ? 'แก้ไขข้อความ' : 'ดูตัวอย่าง'}</span>
        </button>
      </div>

      {/* Editor Body */}
      {isPreview ? (
        <div className={`p-4 prose prose-sm max-w-none text-onSurface bg-surface-card ${minHeight} overflow-y-auto leading-relaxed`}>
          {value ? (
            <div className="whitespace-pre-wrap font-sans text-xs sm:text-sm">{value}</div>
          ) : (
            <p className="text-onSurface-muted italic text-xs">ยังไม่มีเนื้อหาสำหรับแสดงตัวอย่าง</p>
          )}
        </div>
      ) : (
        <textarea
          id="rich-text-area"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full p-4 bg-transparent border-none text-xs sm:text-sm text-onSurface outline-none resize-y ${minHeight} leading-relaxed font-mono`}
        />
      )}
    </div>
  );
}
