import React from 'react';
import { Search, X } from 'lucide-react';

interface UserSearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}

export default function UserSearchBar({
  value,
  onChange,
  placeholder = 'ค้นหาด้วยชื่อ, สกุล, อีเมล, หรือเบอร์โทร...'
}: UserSearchBarProps) {
  return (
    <div className="relative flex-1 min-w-[240px]">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-onSurface-muted">
        <Search className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 pl-10 pr-9 rounded-lg border border-outline bg-surface-card text-onSurface text-sm placeholder:text-onSurface-muted/70 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-onSurface-muted hover:text-onSurface"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
