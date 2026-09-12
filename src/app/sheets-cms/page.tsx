'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SheetsCMSOverviewPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/knowledge');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
