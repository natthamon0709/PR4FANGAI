import React from 'react';

export default function FooterBar() {
  return (
    <footer className="mt-auto py-4 px-6 border-t border-outline/30 bg-surface text-center text-xs text-onSurface-muted">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
        <p>© 2569 วิทยาลัยการอาชีพฝาง — ระบบจัดการองค์ความรู้ PR4Fang AI</p>
        <p className="font-mono text-[11px] text-onSurface-muted/80">Phase 1: v1.0.0 (Auth & User Management)</p>
      </div>
    </footer>
  );
}
