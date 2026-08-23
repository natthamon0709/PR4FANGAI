'use client';
import React, { useRef, useState } from 'react';
import { KnowledgeAttachment } from '@/types/knowledge';
import { Paperclip, UploadCloud, Trash2, FileText, ExternalLink, Loader2 } from 'lucide-react';

interface AttachmentUploaderProps {
  attachments: KnowledgeAttachment[];
  onChange: (attachments: KnowledgeAttachment[]) => void;
  maxFiles?: number;
}

export default function AttachmentUploader({
  attachments = [],
  onChange,
  maxFiles = 5,
}: AttachmentUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (attachments.length + files.length > maxFiles) {
      setErrorMsg(`สามารถแนบไฟล์ได้สูงสุดไม่เกิน ${maxFiles} ไฟล์`);
      return;
    }

    setUploading(true);
    setErrorMsg(null);

    try {
      const newAttachments: KnowledgeAttachment[] = [...attachments];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/knowledge/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          newAttachments.push(data.attachment);
        } else {
          const err = await res.json();
          setErrorMsg(err.error || 'อัปโหลดไฟล์ล้มเหลว');
        }
      }

      onChange(newAttachments);
    } catch (err: any) {
      setErrorMsg('เกิดข้อผิดพลาดในการอัปโหลด: ' + err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (idx: number) => {
    onChange(attachments.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-3">
      {/* Upload Drop Area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-outline/60 hover:border-primary/60 bg-surface-variant/20 hover:bg-surface-variant/40 rounded-xl p-5 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="w-10 h-10 rounded-full bg-surface-card border border-outline/30 flex items-center justify-center group-hover:scale-105 transition-transform">
          {uploading ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : (
            <UploadCloud className="w-5 h-5 text-primary" />
          )}
        </div>

        <div>
          <p className="text-xs font-heading font-semibold text-onSurface">
            คลิกเพื่ออัปโหลดไฟล์แนบ หรือลากไฟล์มาวางที่นี่
          </p>
          <p className="text-[11px] text-onSurface-muted mt-0.5">
            รองรับ PDF, DOCX, XLSX, รูปภาพ (สูงสุด 10MB ต่อไฟล์, ไม่เกิน {maxFiles} ไฟล์)
          </p>
        </div>
      </div>

      {errorMsg && (
        <p className="text-xs text-error font-medium px-1">{errorMsg}</p>
      )}

      {/* Attachment List */}
      {attachments.length > 0 && (
        <div className="space-y-1.5">
          {attachments.map((att, idx) => (
            <div
              key={att.attachment_id || idx}
              className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-outline/30 bg-surface-card text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="font-medium text-onSurface truncate" title={att.file_name}>
                  {att.file_name}
                </span>
                <span className="text-[10px] text-onSurface-muted font-mono flex-shrink-0">
                  ({att.file_size_kb} KB)
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {att.file_url && (
                  <a
                    href={att.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 text-onSurface-muted hover:text-primary transition-colors"
                    title="เปิดดูไฟล์"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="p-1 text-onSurface-muted hover:text-error transition-colors"
                  title="ลบไฟล์แนบ"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
