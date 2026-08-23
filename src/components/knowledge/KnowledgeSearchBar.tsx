'use client';
import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';

interface KnowledgeSearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export default function KnowledgeSearchBar({
  value,
  onChange,
  placeholder = 'ค้นหาจากหัวเรื่อง, สรุปย่อ, แท็ก, หรือเนื้อหา...',
  className = '',
}: KnowledgeSearchBarProps) {
  const [query, setQuery] = useState(value);
  const isFirstRender = React.useRef(true);

  // Debounce 300ms (Section 2.3 Requirement)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (query === value) return;

    const timer = setTimeout(() => {
      onChange(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, value, onChange]);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-4 h-4 text-onSurface-muted absolute left-3.5 pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 pl-10 pr-9 rounded-xl border border-outline bg-surface-card hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 text-xs text-onSurface outline-none transition-all placeholder:text-onSurface-muted"
      />
      {query && (
        <button
          type="button"
          onClick={() => {
            setQuery('');
            onChange('');
          }}
          className="absolute right-3 p-0.5 rounded-full hover:bg-surface-variant text-onSurface-muted hover:text-onSurface"
          title="ล้างคำค้นหา"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}
