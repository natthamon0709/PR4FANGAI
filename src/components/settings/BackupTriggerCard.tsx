'use client';
import React, { useState } from 'react';
import { BackupJob } from '@/types/settings';
import RelativeTimeLabel from '@/components/dashboard/RelativeTimeLabel';
import { DatabaseBackup, Download, Play, CheckCircle2, Clock, Loader2 } from 'lucide-react';

interface BackupTriggerCardProps {
  backups: BackupJob[];
  onRefresh: () => void;
}

export default function BackupTriggerCard({ backups, onRefresh }: BackupTriggerCardProps) {
  const [triggering, setTriggering] = useState(false);

  const handleBackupNow = async () => {
    setTriggering(true);
    try {
      const res = await fetch('/api/settings/backup', { method: 'POST' });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTriggering(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Trigger Hero Card */}
      <div className="p-6 md:p-8 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
            <DatabaseBackup className="w-4 h-4" />
            <span>ระบบสำรองข้อมูลอัตโนมัติ (Automated Database Backup)</span>
          </div>
          <h2 className="text-base md:text-lg font-bold text-onSurface font-heading">
            สำรองฐานข้อมูลระบบทันที (On-demand Backup)
          </h2>
          <p className="text-xs text-onSurface-muted max-w-xl">
            สร้างสำเนา Snapshot ฐานข้อมูล SQLite พร้อมข้อมูลโครงสร้างทั้งหมด ไฟล์สำรองจะถูกเก็บรักษาไว้อย่างปลอดภัยและดาวน์โหลดได้ภายใน 30 วัน
          </p>
        </div>

        <button
          type="button"
          disabled={triggering}
          onClick={handleBackupNow}
          className="px-5 py-3 bg-primary text-white rounded-xl text-xs md:text-sm font-bold hover:bg-primary-dark shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all flex-shrink-0"
        >
          {triggering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
          <span>{triggering ? 'กำลังสำรองข้อมูล...' : 'สำรองข้อมูลตอนนี้'}</span>
        </button>
      </div>

      {/* Backup History Table */}
      <div className="p-5 md:p-6 bg-surface-card rounded-2xl border border-outline/30 shadow-level1 space-y-4">
        <h3 className="font-heading font-bold text-sm md:text-base text-onSurface flex items-center gap-2 border-b border-outline/20 pb-3">
          <Clock className="w-4 h-4 text-primary" />
          <span>ประวัติไฟล์สำรองข้อมูล (Backup History)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-outline/20 text-onSurface-muted bg-surface/50">
                <th className="p-3 font-semibold">รหัสสำรองข้อมูล</th>
                <th className="p-3 font-semibold">ประเภท</th>
                <th className="p-3 font-semibold">ขนาดไฟล์</th>
                <th className="p-3 font-semibold">ผู้ดำเนินการ</th>
                <th className="p-3 font-semibold">เวลาที่สร้าง</th>
                <th className="p-3 font-semibold text-right">ดาวน์โหลด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/10">
              {backups.map((b) => (
                <tr key={b.backup_id} className="hover:bg-primary-container/5 transition-colors">
                  <td className="p-3 font-mono font-bold text-primary">{b.backup_id}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      b.triggered_by === 'manual' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {b.triggered_by === 'manual' ? 'สั่งด้วยตนเอง' : 'ตามตารางเวลา'}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-onSurface">{formatBytes(b.file_size)}</td>
                  <td className="p-3 text-onSurface-muted">{b.creator_name || 'ผู้ดูแลระบบ'}</td>
                  <td className="p-3 text-onSurface-muted">
                    <RelativeTimeLabel dateString={b.created_at} />
                  </td>
                  <td className="p-3 text-right">
                    {b.file_url ? (
                      <a
                        href={b.file_url}
                        download
                        className="px-3 py-1 bg-surface border border-outline/30 hover:border-primary text-primary rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>ดาวน์โหลด (.db)</span>
                      </a>
                    ) : (
                      <span className="text-onSurface-muted text-[11px]">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
