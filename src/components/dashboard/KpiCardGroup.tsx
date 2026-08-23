import React from 'react';
import { KpiMetric } from '@/types/dashboard';
import KpiCard from './KpiCard';

interface KpiCardGroupProps {
  kpis: KpiMetric[];
}

export default function KpiCardGroup({ kpis }: KpiCardGroupProps) {
  if (!kpis || kpis.length === 0) return null;

  // Responsive Grid:
  // Admin (4 cards) -> 4 cols on lg, 2 cols on sm/md
  // Staff (3 cards) -> 3 cols on lg, 3 cols on md, 1 col on sm
  const gridCols = kpis.length === 4
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
    : 'grid-cols-1 sm:grid-cols-3';

  return (
    <div className={`grid ${gridCols} gap-4 w-full`}>
      {kpis.map((metric) => (
        <KpiCard key={metric.key} metric={metric} />
      ))}
    </div>
  );
}
