import React from 'react';
import { ExternalLink } from 'lucide-react';

interface OpenInSheetsButtonProps {
  sheetId?: string;
  gid?: string;
  className?: string;
  label?: string;
}

export default function OpenInSheetsButton({
  sheetId = '1-zp32f6bkCcXpGo5O__moHCAXcm_Sjg0rTPRkTK6fYs',
  gid = '547794364',
  className = '',
  label = 'เปิดใน Google Sheets',
}: OpenInSheetsButtonProps) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetId}/edit#gid=${gid}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-outline bg-surface-card hover:bg-surface-variant text-xs font-semibold text-onSurface hover:text-primary transition-all shadow-sm ${className}`}
      title="เปิดไปยัง Google Sheets ฉบับจริงในแท็บใหม่"
    >
      <svg className="w-4 h-4 text-[#0F9D58] flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
        <path d="M7 7h10v2H7zm0 4h10v2H7zm0 4h7v2H7z"/>
      </svg>
      <span>{label}</span>
      <ExternalLink className="w-3 h-3 text-onSurface-muted" />
    </a>
  );
}
