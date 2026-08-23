'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KnowledgeItem } from '@/types/knowledge';
import ContentTypeBadge from './ContentTypeBadge';
import KnowledgeStatusBadge from './KnowledgeStatusBadge';
import AIUsageCounter from './AIUsageCounter';
import ArchiveConfirmDialog from './ArchiveConfirmDialog';
import { formatThaiRelativeTime } from '@/components/dashboard/RelativeTimeLabel';
import { 
  ArrowLeft, 
  Edit3, 
  Archive, 
  History, 
  Bot, 
  Calendar, 
  Building, 
  FileText, 
  ExternalLink,
  User,
  Share2,
  Check
} from 'lucide-react';

interface KnowledgeDetailViewProps {
  item: KnowledgeItem;
  canEdit?: boolean;
  canArchive?: boolean;
  currentUserDeptId?: string;
  isAdmin?: boolean;
}

export default function KnowledgeDetailView({
  item,
  canEdit = false,
  canArchive = false,
  currentUserDeptId,
  isAdmin = false,
}: KnowledgeDetailViewProps) {
  const router = useRouter();
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleArchiveConfirm = async () => {
    try {
      const newStatus = item.status === 'archived' ? 'published' : 'archived';
      const res = await fetch(`/api/knowledge/${item.knowledge_id}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setArchiveModalOpen(false);
        router.refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline/20">
        <div>
          <Link
            href="/knowledge"
            className="inline-flex items-center gap-1.5 text-xs text-onSurface-muted hover:text-primary transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับสู่รายการองค์ความรู้</span>
          </Link>
          <div className="flex flex-wrap items-center gap-2 mt-1">
            <ContentTypeBadge type={item.content_type} />
            <KnowledgeStatusBadge status={item.status} />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="h-9 px-3 rounded-lg border border-outline bg-surface-card hover:bg-surface-variant text-xs font-semibold text-onSurface flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'คัดลอกลิงก์แล้ว' : 'แชร์'}</span>
          </button>

          {canEdit && (
            <Link
              href={`/knowledge/${item.knowledge_id}/edit`}
              className="h-9 px-3.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>แก้ไข</span>
            </Link>
          )}

          <Link
            href={`/knowledge/${item.knowledge_id}/history`}
            className="h-9 px-3 rounded-lg border border-outline bg-surface-card hover:bg-surface-variant text-xs font-semibold text-onSurface flex items-center gap-1.5 transition-colors"
            title="ดูประวัติการแก้ไขย้อนหลัง"
          >
            <History className="w-3.5 h-3.5" />
            <span>ประวัติ ({item.version_count || 1})</span>
          </Link>

          {canArchive && (
            <button
              type="button"
              onClick={() => setArchiveModalOpen(true)}
              className="h-9 px-3 rounded-lg border border-error/40 text-error hover:bg-error-container/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>{item.status === 'archived' ? 'เผยแพร่อีกครั้ง' : 'เก็บถาวร'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column Detail Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Main Article */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-surface-card border border-outline/30 shadow-level1 space-y-4">
            <h1 className="text-xl md:text-2xl font-heading font-extrabold text-onSurface leading-tight">
              {item.title}
            </h1>

            {/* AI Summary Highlight Box */}
            <div className="p-4 rounded-xl bg-secondary-container/40 border border-secondary/30 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-secondary-dark">
                <Bot className="w-4 h-4" />
                <span>สรุปสาระสำคัญ (AI Prompt Context)</span>
              </div>
              <p className="text-xs text-onSurface leading-relaxed">
                {item.summary}
              </p>
            </div>

            {/* Full Markdown Body */}
            <div className="pt-2 text-xs sm:text-sm text-onSurface leading-relaxed whitespace-pre-wrap font-sans border-t border-outline/15">
              {item.content}
            </div>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="pt-4 border-t border-outline/15">
                <span className="text-[11px] font-bold text-onSurface-muted block mb-2">แท็กที่เกี่ยวข้อง:</span>
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-full bg-primary-container text-primary text-xs font-semibold"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Attachments Section */}
          {item.attachments && item.attachments.length > 0 && (
            <div className="p-6 rounded-2xl bg-surface-card border border-outline/30 shadow-level1 space-y-3">
              <h3 className="font-heading font-bold text-sm text-onSurface flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>เอกสารและไฟล์แนบประกอบ ({item.attachments.length} ไฟล์)</span>
              </h3>

              <div className="divide-y divide-outline/15">
                {item.attachments.map((att) => (
                  <div
                    key={att.attachment_id}
                    className="py-2.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-xs font-medium text-onSurface truncate">
                        {att.file_name}
                      </span>
                      <span className="text-[10px] text-onSurface-muted font-mono flex-shrink-0">
                        ({att.file_size_kb} KB)
                      </span>
                    </div>

                    <a
                      href={att.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-variant text-onSurface hover:text-primary text-xs font-semibold transition-colors flex-shrink-0"
                    >
                      <span>เปิดเอกสาร</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Column: Metadata & AI Analytics */}
        <div className="space-y-5">
          {/* AI Citation Counter (C47) */}
          <AIUsageCounter count={item.ai_reference_count || 0} />

          {/* Metadata Card */}
          <div className="p-5 rounded-2xl bg-surface-card border border-outline/30 shadow-level1 space-y-3.5 text-xs">
            <h4 className="font-heading font-bold text-xs text-onSurface border-b border-outline/20 pb-2">
              ข้อมูลระเบียบและสังกัด
            </h4>

            <div>
              <span className="text-onSurface-muted block text-[11px]">หน่วยงานที่รับผิดชอบ:</span>
              <p className="font-semibold text-onSurface mt-0.5">
                {item.department_name}
              </p>
              <p className="text-onSurface-muted text-[11px]">
                {item.sub_department_name}
              </p>
            </div>

            {item.effective_date && (
              <div>
                <span className="text-onSurface-muted block text-[11px]">วันที่มีผลบังคับใช้:</span>
                <p className="font-semibold text-onSurface mt-0.5">
                  {item.effective_date}
                </p>
              </div>
            )}

            {item.expiry_date && (
              <div>
                <span className="text-onSurface-muted block text-[11px]">วันที่หมดอายุ:</span>
                <p className="font-semibold text-onSurface mt-0.5">
                  {item.expiry_date}
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-outline/15 space-y-1 text-[11px] text-onSurface-muted">
              <div>สร้างโดย: {item.creator_name || 'เจ้าหน้าที่'}</div>
              <div>แก้ไขล่าสุด: {formatThaiRelativeTime(item.updated_at)}</div>
              <div>เข้าชม: {item.view_count || 0} ครั้ง</div>
            </div>
          </div>
        </div>
      </div>

      {/* Archive Confirmation Dialog (C48) */}
      <ArchiveConfirmDialog
        isOpen={archiveModalOpen}
        onClose={() => setArchiveModalOpen(false)}
        onConfirm={handleArchiveConfirm}
        title={item.title}
        isArchiving={item.status !== 'archived'}
      />
    </div>
  );
}
