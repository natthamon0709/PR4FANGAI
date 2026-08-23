'use client';
import React, { useState } from 'react';
import { Tag, Plus, X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  placeholder?: string;
}

export default function TagInput({
  tags = [],
  onChange,
  maxTags = 10,
  placeholder = 'พิมพ์แท็กแล้วกด Enter (เช่น #ระเบียบ, #การเงิน)',
}: TagInputProps) {
  const [inputVal, setInputVal] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const clean = inputVal.replace(/^[#,]+/, '').trim();
    if (clean && !tags.includes(clean) && tags.length < maxTags) {
      onChange([...tags, clean]);
      setInputVal('');
    }
  };

  const removeTag = (idx: number) => {
    onChange(tags.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl border border-outline bg-surface-card min-h-[46px] focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        {tags.map((t, idx) => (
          <span
            key={idx}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-container text-primary text-xs font-semibold animate-fadeIn"
          >
            <span>#{t}</span>
            <button
              type="button"
              onClick={() => removeTag(idx)}
              className="p-0.5 rounded-full hover:bg-primary/20 text-primary transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {tags.length < maxTags && (
          <div className="flex items-center gap-1 flex-1 min-w-[150px]">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={tags.length === 0 ? placeholder : 'เพิ่มแท็ก...'}
              className="w-full bg-transparent border-none text-xs text-onSurface outline-none px-1"
            />
            {inputVal.trim() && (
              <button
                type="button"
                onClick={addTag}
                className="p-1 rounded-md bg-primary text-white text-[10px] font-bold"
              >
                <Plus className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-between text-[11px] text-onSurface-muted px-1">
        <span>ใช้จัดกลุ่มและช่วยให้ AI ค้นพบเนื้อหาได้แม่นยำ</span>
        <span>{tags.length}/{maxTags} แท็ก</span>
      </div>
    </div>
  );
}
