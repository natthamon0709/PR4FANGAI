import React from 'react';
import DatabaseStatusCard from './DatabaseStatusCard';

interface SheetSyncStatusCardProps {
  pendingCount?: number;
  lastSynced?: string;
  sheetUrl?: string;
  onSyncNow?: () => void;
  syncing?: boolean;
  dbStatus?: any;
}

export default function SheetSyncStatusCard({
  dbStatus,
  lastSynced,
}: SheetSyncStatusCardProps) {
  return <DatabaseStatusCard dbStatus={dbStatus} lastChecked={lastSynced} />;
}
