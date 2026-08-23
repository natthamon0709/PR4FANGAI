'use client';
import React from 'react';
import Link from 'next/link';
import { RankingItem } from '@/types/analytics';
import { Award, ArrowRight } from 'lucide-react';

interface RankingListProps {
  items: RankingItem[];
  title?: string;
  subtitle?: string;
  unit?: string;
  viewAllLink?: string;
}

export default function RankingList({
  items = [],
  title = 'รายการจัดอันดับ',
  subtitle,
  unit = 'ครั้ง',
  viewAllLink
}: RankingListProps) {
  return (
    <div className="p-5 md:p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between gap-2 pb-3 mb-2 border-b border-outline/20">
        <div>
          <h3 className="font-heading font-bold text-sm md:text-base text-onSurface flex items-center gap-2">
            <Award className="w-4 h-4 text-secondary" />
            <span>{title}</span>
          </h3>
          {subtitle && <p className="text-[11px] text-onSurface-muted mt-0.5">{subtitle}</p>}
        </div>
        {viewAllLink && (
          <Link href={viewAllLink} className="text-xs font-semibold text-primary hover:underline flex items-center gap-1">
            <span>ดูทั้งหมด</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      <div className="divide-y divide-outline/15 my-1">
        {items.map((item) => {
          const isTop3 = item.rank <= 3;
          return (
            <div key={item.id} className="py-2.5 flex items-center justify-between gap-3 group">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Number Badge */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                    isTop3
                      ? 'bg-secondary/20 text-secondary-dark border border-secondary/40 font-black'
                      : 'bg-surface border border-outline/30 text-onSurface-muted'
                  }`}
                >
                  {item.rank}
                </div>

                <div className="min-w-0 flex-1">
                  {item.linkUrl ? (
                    <Link href={item.linkUrl} className="text-xs md:text-sm font-semibold text-onSurface hover:text-primary transition-colors truncate block">
                      {item.title}
                    </Link>
                  ) : (
                    <p className="text-xs md:text-sm font-semibold text-onSurface truncate">{item.title}</p>
                  )}
                  {item.subtitle && (
                    <p className="text-[11px] text-onSurface-muted truncate">{item.subtitle}</p>
                  )}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="font-bold text-xs md:text-sm text-primary">
                  {item.count.toLocaleString()}
                </span>
                <span className="text-[11px] text-onSurface-muted ml-1">{unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
