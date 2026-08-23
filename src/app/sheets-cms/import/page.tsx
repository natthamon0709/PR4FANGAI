'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import BulkImportPreviewTable from '@/components/sheets/BulkImportPreviewTable';
import ImportSummaryCard from '@/components/sheets/ImportSummaryCard';
import SessionAlert from '@/components/SessionAlert';
import { SessionUser } from '@/types';
import { BulkImportPreviewRow } from '@/types/sheets';
import { ArrowLeft, UploadCloud, RefreshCw, CheckCircle2, Loader2, FileSpreadsheet } from 'lucide-react';

export default function BulkImportPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [selectedSheet, setSelectedSheet] = useState('knowledge');
  const [previewRows, setPreviewRows] = useState<BulkImportPreviewRow[]>([]);
  const [total, setTotal] = useState(0);
  const [validCount, setValidCount] = useState(0);
  const [invalidCount, setInvalidCount] = useState(0);
  const [importedCount, setImportedCount] = useState<number | undefined>(undefined);
  
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/login');
          return;
        }
        const data = await res.json();
        if (data.user.role !== 'administrator') {
          router.push('/sheets-cms');
          return;
        }
        setCurrentUser(data.user);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [router]);

  const loadPreview = async () => {
    setLoading(true);
    setImportedCount(undefined);
    try {
      const res = await fetch('/api/sheets-cms/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheet_name: selectedSheet, action: 'preview' }),
      });

      if (res.ok) {
        const data = await res.json();
        setPreviewRows(data.preview_rows || []);
        setTotal(data.total || 0);
        setValidCount(data.valid_count || 0);
        setInvalidCount(data.invalid_count || 0);
      }
    } catch (e: any) {
      setAlertMsg({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadPreview();
    }
  }, [currentUser, selectedSheet]);

  const handleExecuteImport = async () => {
    setImporting(true);
    try {
      const res = await fetch('/api/sheets-cms/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheet_name: selectedSheet,
          action: 'execute',
          confirmed_rows: previewRows,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setImportedCount(data.imported_count);
        setAlertMsg({ type: 'success', text: data.message });
      } else {
        setAlertMsg({ type: 'error', text: data.error });
      }
    } catch (e: any) {
      setAlertMsg({ type: 'error', text: e.message });
    } finally {
      setImporting(false);
    }
  };

  if (loading && previewRows.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout
      user={currentUser!}
      breadcrumbs={[
        { label: 'Google Sheets CMS', href: '/sheets-cms' },
        { label: 'นำเข้าข้อมูลจำนวนมาก (Bulk Import)' },
      ]}
    >
      <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline/20">
          <div>
            <Link
              href="/sheets-cms"
              className="inline-flex items-center gap-1.5 text-xs text-onSurface-muted hover:text-primary transition-colors mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>กลับสู่ภาพรวม</span>
            </Link>
            <h1 className="text-xl md:text-2xl font-heading font-extrabold text-onSurface flex items-center gap-2">
              <UploadCloud className="w-6 h-6 text-primary" />
              <span>นำเข้าข้อมูลจำนวนมาก (Bulk Import — ช่วงเริ่มต้นใช้งาน)</span>
            </h1>
            <p className="text-xs text-onSurface-muted mt-0.5">
              ดึงข้อมูลจาก Google Sheets มาตรวจสอบความถูกต้องรายแถวก่อนบันทึกลงฐานข้อมูลหลักแบบ Batch
            </p>
          </div>
        </div>

        {alertMsg && (
          <SessionAlert
            type={alertMsg.type}
            message={alertMsg.text}
            onClose={() => setAlertMsg(null)}
          />
        )}

        {/* Top Control Bar: Select Sheet & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-surface-card border border-outline/30 shadow-level1">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#0F9D58]" />
            <label className="text-xs font-bold text-onSurface">เลือกชีทต้นทาง:</label>
            <select
              value={selectedSheet}
              onChange={(e) => setSelectedSheet(e.target.value)}
              className="h-10 px-3 rounded-xl border border-outline bg-surface text-xs text-onSurface font-semibold outline-none cursor-pointer"
            >
              <option value="knowledge">องค์ความรู้และระเบียบ (Knowledge Base)</option>
              <option value="master_users">ข้อมูลผู้ใช้งาน (Master Users)</option>
              <option value="faq">คำถามที่พบบ่อย (FAQ)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadPreview}
              className="h-10 px-3.5 rounded-xl border border-outline bg-surface hover:bg-surface-variant text-xs font-semibold text-onSurface flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-onSurface-muted" />
              <span>ตรวจสอบข้อมูลใหม่</span>
            </button>

            <button
              type="button"
              disabled={validCount === 0 || importing}
              onClick={handleExecuteImport}
              className="h-10 px-5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-heading font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>ยืนยันนำเข้าข้อมูล ({validCount} แถวที่ผ่าน)</span>
            </button>
          </div>
        </div>

        {/* Import Summary Cards (C57) */}
        <ImportSummaryCard
          total={total}
          validCount={validCount}
          invalidCount={invalidCount}
          importedCount={importedCount}
        />

        {/* Preview Table (C56) */}
        <div className="space-y-2">
          <h3 className="font-heading font-bold text-sm text-onSurface">
            ตารางแสดงตัวอย่างข้อมูลและผลตรวจสอบรายแถว ({previewRows.length} รายการ)
          </h3>
          <BulkImportPreviewTable rows={previewRows} />
        </div>
      </div>
    </DashboardLayout>
  );
}
