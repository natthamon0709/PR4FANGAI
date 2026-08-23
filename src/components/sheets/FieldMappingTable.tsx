import React from 'react';
import { ArrowRight, Link2 } from 'lucide-react';

interface FieldMappingTableProps {
  mapping: Record<string, string>;
  sheetName: string;
}

export default function FieldMappingTable({ mapping, sheetName }: FieldMappingTableProps) {
  const entries = Object.entries(mapping);

  return (
    <div className="rounded-xl border border-outline/30 bg-surface-card overflow-hidden text-xs">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-surface-variant/50 border-b border-outline/30 text-onSurface-variant font-heading font-semibold">
            <th className="py-2.5 px-4">ชื่อคอลัมน์ใน Google Sheet</th>
            <th className="py-2.5 px-2 text-center w-12"></th>
            <th className="py-2.5 px-4">ฟิลด์ในฐานข้อมูลหลัก (Database)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline/15 text-onSurface">
          {entries.map(([sheetCol, dbField]) => (
            <tr key={sheetCol} className="hover:bg-surface-variant/20 transition-colors">
              <td className="py-2.5 px-4 font-mono font-medium text-onSurface">
                {sheetCol}
              </td>
              <td className="py-2.5 px-2 text-center text-onSurface-muted">
                <ArrowRight className="w-3.5 h-3.5 inline" />
              </td>
              <td className="py-2.5 px-4 font-mono text-primary font-bold">
                {dbField}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
