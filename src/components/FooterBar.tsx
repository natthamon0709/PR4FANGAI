import React from 'react';

export default function FooterBar() {
  return (
    <footer className="mt-auto py-5 px-6 border-t border-outline/40 bg-surface/50 text-center text-xs text-onSurface-muted">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
        <p className="font-medium text-[11px]">
          © 2569 <span className="text-onSurface font-semibold">วิทยาลัยการอาชีพฝาง</span> — ระบบจัดการองค์ความรู้ PR4Fang AI
        </p>
        <p className="font-mono text-[10px] text-onSurface-muted/70 px-2 py-0.5 rounded-md bg-surface-variant/60 border border-outline/30">
          Phase 1: v1.0.0 (Production Ready)
        </p>
      </div>
    </footer>
  );
}
