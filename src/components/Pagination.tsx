import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (newPage: number) => void;
}

export default function Pagination({
  page,
  totalPages,
  totalItems,
  limit,
  onPageChange,
}: PaginationProps) {
  if (totalItems === 0) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-2 text-sm text-onSurface-variant">
      <div>
        แสดง <span className="font-medium text-onSurface">{startItem} - {endItem}</span> จากทั้งหมด <span className="font-medium text-onSurface">{totalItems}</span> รายการ
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-2 rounded-md hover:bg-surface-variant disabled:opacity-30 disabled:cursor-not-allowed text-onSurface transition-colors"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
          // Show only nearby pages
          if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
            return (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={`min-w-[36px] h-9 px-3 rounded-md text-xs font-medium transition-colors ${
                  p === page
                    ? 'bg-primary text-white font-bold shadow-sm'
                    : 'hover:bg-surface-variant text-onSurface'
                }`}
              >
                {p}
              </button>
            );
          } else if (p === page - 2 || p === page + 2) {
            return <span key={p} className="px-1 text-onSurface-muted">...</span>;
          }
          return null;
        })}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-2 rounded-md hover:bg-surface-variant disabled:opacity-30 disabled:cursor-not-allowed text-onSurface transition-colors"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
