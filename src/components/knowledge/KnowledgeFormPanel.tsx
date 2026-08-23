'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ContentType, KnowledgeStatus, KnowledgeAttachment, KnowledgeItem } from '@/types/knowledge';
import { Department, SubDepartment, SessionUser } from '@/types';
import { CONTENT_TYPE_CONFIG } from './ContentTypeBadge';
import RichTextEditor from './RichTextEditor';
import TagInput from './TagInput';
import EffectiveDateRange from './EffectiveDateRange';
import AttachmentUploader from './AttachmentUploader';
import AIRetrievalToggle from './AIRetrievalToggle';
import { 
  Save, 
  Send, 
  ArrowLeft, 
  Sparkles, 
  HelpCircle, 
  Info,
  Loader2
} from 'lucide-react';

interface KnowledgeFormPanelProps {
  initialData?: Partial<KnowledgeItem>;
  departments: Department[];
  subDepartments: SubDepartment[];
  currentUser: SessionUser;
  isEdit?: boolean;
}

export default function KnowledgeFormPanel({
  initialData,
  departments = [],
  subDepartments = [],
  currentUser,
  isEdit = false,
}: KnowledgeFormPanelProps) {
  const router = useRouter();
  const isAdmin = currentUser.role === 'administrator';

  // Form State
  const [contentType, setContentType] = useState<ContentType>(
    (initialData?.content_type as ContentType) || 'regulation'
  );
  const [title, setTitle] = useState(initialData?.title || '');
  const [summary, setSummary] = useState(initialData?.summary || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [departmentId, setDepartmentId] = useState(
    initialData?.department_id || currentUser.department_id || (departments[0]?.department_id ?? '')
  );
  const [subDepartmentId, setSubDepartmentId] = useState(
    initialData?.sub_department_id || currentUser.sub_department_id || ''
  );
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [effectiveDate, setEffectiveDate] = useState<string | null>(initialData?.effective_date || null);
  const [expiryDate, setExpiryDate] = useState<string | null>(initialData?.expiry_date || null);
  const [aiRetrievalEnabled, setAiRetrievalEnabled] = useState(
    initialData?.ai_retrieval_enabled !== undefined ? initialData.ai_retrieval_enabled : true
  );
  const [attachments, setAttachments] = useState<KnowledgeAttachment[]>(initialData?.attachments || []);
  
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Progressive Disclosure: show dates only for regulation, announcement, news
  const showDateFields = ['regulation', 'announcement', 'news'].includes(contentType);

  // Sub-departments of selected dept
  const filteredSubDepts = subDepartments.filter((s) => s.department_id === departmentId);

  const handleSubmit = async (submitStatus: KnowledgeStatus) => {
    if (!title.trim()) {
      setErrorMsg('กรุณากรอกหัวข้อเรื่อง');
      return;
    }
    if (!summary.trim()) {
      setErrorMsg('กรุณากรอกสรุปย่อ (จำเป็นสำหรับให้ AI ใช้เป็นตัวอย่างคำตอบ)');
      return;
    }
    if (!content.trim()) {
      setErrorMsg('กรุณากรอกเนื้อหาองค์ความรู้');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    const payload = {
      content_type: contentType,
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim(),
      department_id: departmentId,
      sub_department_id: subDepartmentId || (filteredSubDepts[0]?.sub_department_id ?? ''),
      tags,
      status: submitStatus,
      effective_date: showDateFields ? effectiveDate : null,
      expiry_date: showDateFields ? expiryDate : null,
      ai_retrieval_enabled: aiRetrievalEnabled,
      attachments,
    };

    try {
      const url = isEdit && initialData?.knowledge_id 
        ? `/api/knowledge/${initialData.knowledge_id}` 
        : '/api/knowledge';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'บันทึกข้อมูลไม่สำเร็จ');
      }

      router.push(`/knowledge/${data.knowledge_id || initialData?.knowledge_id}`);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Breadcrumb Header */}
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-outline/20">
        <div>
          <button
            type="button"
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-xs text-onSurface-muted hover:text-primary transition-colors mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>ย้อนกลับ</span>
          </button>
          <h1 className="text-xl md:text-2xl font-heading font-extrabold text-onSurface">
            {isEdit ? 'แก้ไของค์ความรู้' : 'เพิ่มองค์ความรู้ใหม่ (Unified Schema)'}
          </h1>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-error-container text-error text-xs font-semibold flex items-center gap-2 border border-error/30 animate-fadeIn">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main 2-Column Responsive Layout (Desktop: 2-col, Tablet/Mobile: 1-col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Main Content Form */}
        <div className="lg:col-span-2 space-y-5">
          {/* 1. Content Type Selector (8 types) */}
          <div className="p-5 rounded-2xl bg-surface-card border border-outline/30 shadow-level1 space-y-3">
            <label className="block text-xs font-heading font-bold text-onSurface">
              1. เลือกประเภทข้อมูล (Content Type) <span className="text-error">*</span>
            </label>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(CONTENT_TYPE_CONFIG) as ContentType[]).map((typeKey) => {
                const config = CONTENT_TYPE_CONFIG[typeKey];
                const IconComponent = config.icon;
                const isSelected = contentType === typeKey;

                return (
                  <button
                    key={typeKey}
                    type="button"
                    onClick={() => setContentType(typeKey)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? `border-primary bg-primary-container text-primary font-bold shadow-sm ring-2 ring-primary/20`
                        : `border-outline/40 bg-surface-variant/20 hover:bg-surface-variant/50 text-onSurface-variant`
                    }`}
                  >
                    <IconComponent className={`w-5 h-5 mb-1.5 ${isSelected ? 'text-primary' : config.color}`} />
                    <span className="text-[11px] leading-tight font-medium">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Title & AI Summary */}
          <div className="p-5 rounded-2xl bg-surface-card border border-outline/30 shadow-level1 space-y-4">
            <div>
              <label className="block text-xs font-heading font-bold text-onSurface mb-1.5">
                2. หัวข้อเรื่อง (Title) <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="เช่น ระเบียบการลาศึกษาต่อและพัฒนาวิชาชีพบุคลากร 2569"
                className="w-full h-11 px-3.5 rounded-xl border border-outline bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 text-xs sm:text-sm text-onSurface outline-none transition-all font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-heading font-bold text-onSurface flex items-center gap-1.5">
                  <span>3. สรุปย่อ (Summary)</span>
                  <span className="text-error">*</span>
                  <span className="px-1.5 py-0.2 rounded bg-secondary-container text-secondary-dark text-[10px] font-bold">
                    AI Prompt Preview
                  </span>
                </label>
                <span className="text-[11px] text-onSurface-muted">{summary.length}/500 ตัวอักษร</span>
              </div>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="สรุปสาระสำคัญ 2-3 บรรทัด เพื่อให้ AI ใช้เป็นแนวทางหลักในการตอบคำถามอย่างกระชับและตรงจุด..."
                className="w-full p-3 rounded-xl border border-outline bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 text-xs text-onSurface outline-none transition-all leading-relaxed resize-none"
              />
              <p className="text-[11px] text-onSurface-muted mt-1">
                💡 สรุปย่อที่ดีจะช่วยให้ AI เข้าใจบริบทและตอบคำถามใน LINE OA ได้แม่นยำยิ่งขึ้น
              </p>
            </div>

            {/* 3. Rich Text Content */}
            <div>
              <label className="block text-xs font-heading font-bold text-onSurface mb-1.5">
                4. เนื้อหาฉบับเต็ม (Content) <span className="text-error">*</span>
              </label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="พิมพ์รายละเอียดระเบียบ ขั้นตอน หรือเนื้อหาฉบับเต็ม..."
              />
            </div>
          </div>

          {/* 4. Progressive Disclosure Dates (Conditional) */}
          {showDateFields && (
            <div className="p-5 rounded-2xl bg-surface-card border border-outline/30 shadow-level1 space-y-2">
              <label className="block text-xs font-heading font-bold text-onSurface">
                5. กำหนดระยะเวลามีผลบังคับใช้ (สำหรับ{CONTENT_TYPE_CONFIG[contentType]?.label})
              </label>
              <EffectiveDateRange
                effectiveDate={effectiveDate}
                expiryDate={expiryDate}
                onEffectiveDateChange={setEffectiveDate}
                onExpiryDateChange={setExpiryDate}
                isRequired={contentType === 'regulation'}
              />
            </div>
          )}

          {/* 5. Attachment Uploader (C42) */}
          <div className="p-5 rounded-2xl bg-surface-card border border-outline/30 shadow-level1 space-y-3">
            <label className="block text-xs font-heading font-bold text-onSurface">
              6. เอกสารและไฟล์แนบประกอบ (Attachments)
            </label>
            <AttachmentUploader
              attachments={attachments}
              onChange={setAttachments}
            />
          </div>
        </div>

        {/* Right 1 Column: Metadata & Actions */}
        <div className="space-y-5">
          {/* Department & Sub-department */}
          <div className="p-5 rounded-2xl bg-surface-card border border-outline/30 shadow-level1 space-y-4">
            <h4 className="font-heading font-bold text-xs text-onSurface border-b border-outline/20 pb-2">
              สังกัดหน่วยงาน
            </h4>

            <div>
              <label className="block text-xs text-onSurface-muted mb-1">
                ฝ่ายหลัก {isAdmin ? <span className="text-error">*</span> : '(สังกัดของคุณ)'}
              </label>
              <select
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value);
                  const firstSub = subDepartments.find((s) => s.department_id === e.target.value);
                  if (firstSub) setSubDepartmentId(firstSub.sub_department_id);
                }}
                disabled={!isAdmin}
                className="w-full h-10 px-3 rounded-xl border border-outline bg-surface text-xs text-onSurface outline-none disabled:opacity-60 cursor-pointer"
              >
                {departments.map((d) => (
                  <option key={d.department_id} value={d.department_id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-onSurface-muted mb-1">
                งาน / แผนกย่อย
              </label>
              <select
                value={subDepartmentId}
                onChange={(e) => setSubDepartmentId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-outline bg-surface text-xs text-onSurface outline-none cursor-pointer"
              >
                {filteredSubDepts.map((s) => (
                  <option key={s.sub_department_id} value={s.sub_department_id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags (C41) */}
          <div className="p-5 rounded-2xl bg-surface-card border border-outline/30 shadow-level1 space-y-3">
            <h4 className="font-heading font-bold text-xs text-onSurface border-b border-outline/20 pb-2">
              แท็กคำค้นหา (Tags)
            </h4>
            <TagInput tags={tags} onChange={setTags} />
          </div>

          {/* AI Retrieval Toggle (C44) */}
          <AIRetrievalToggle
            enabled={aiRetrievalEnabled}
            onChange={setAiRetrievalEnabled}
          />

          {/* Submit Actions */}
          <div className="p-5 rounded-2xl bg-surface-card border border-outline/30 shadow-level1 space-y-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit('published')}
              className="w-full h-11 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-heading font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{isEdit ? 'บันทึกการแก้ไขและเผยแพร่' : 'บันทึกและเผยแพร่ทันที'}</span>
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSubmit('draft')}
              className="w-full h-10 rounded-xl border border-outline bg-surface hover:bg-surface-variant text-xs font-semibold text-onSurface flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-onSurface-muted" />
              <span>บันทึกเป็นแบบร่าง (Draft)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
