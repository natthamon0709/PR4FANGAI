'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import ConfidenceScoreBar from '@/components/ai/ConfidenceScoreBar';
import FeedbackBadge from '@/components/ai/FeedbackBadge';
import MarkAsGapButton from '@/components/ai/MarkAsGapButton';
import RetrievedSourceCard from '@/components/ai/RetrievedSourceCard';
import { SessionUser } from '@/types';
import { AiQueryLog, FeedbackType } from '@/types/ai';
import { ArrowLeft, Bot, Clock, MessageSquare, ShieldCheck, FileText, Loader2, AlertTriangle } from 'lucide-react';

interface LogDetailPageProps {
  params: { id: string };
}

export default function AiLogDetailPage({ params }: LogDetailPageProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [log, setLog] = useState<AiQueryLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const userRes = await fetch('/api/auth/me');
        if (!userRes.ok) {
          router.push('/login');
          return;
        }
        const userData = await userRes.json();
        setCurrentUser(userData.user);

        const logRes = await fetch(`/api/ai-engine/logs/${params.id}`);
        if (logRes.ok) {
          const logData = await logRes.json();
          setLog(logData.log);
        } else {
          setError('ไม่พบบันทึกการสนทนานี้');
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params.id, router]);

  const handleFeedback = async (val: FeedbackType) => {
    if (!log) return;
    setLog(prev => prev ? { ...prev, feedback: val } : null);
    try {
      await fetch('/api/ai-engine/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ log_id: log.log_id, feedback: val })
      });
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !log) {
    return (
      <DashboardLayout
        user={currentUser}
        breadcrumbs={[
          { label: 'AI Logs', href: '/ai-logs' },
          { label: 'ไม่พบข้อมูล' },
        ]}
      >
        <div className="max-w-xl mx-auto text-center py-16 space-y-4">
          <AlertTriangle className="w-12 h-12 text-error mx-auto" />
          <h2 className="text-xl font-bold text-onSurface">{error || 'ไม่พบบันทึกการสนทนา'}</h2>
          <Link
            href="/ai-logs"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-onPrimary text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้ารายการ AI Logs</span>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      user={currentUser}
      breadcrumbs={[
        { label: 'ระบบปัญญาประดิษฐ์ (AI Engine)' },
        { label: 'AI Logs', href: '/ai-logs' },
        { label: `Log #${log.log_id.slice(-8)}` },
      ]}
    >
      <div className="space-y-6 max-w-4xl mx-auto animate-fadeIn">
        {/* Back navigation */}
        <Link
          href="/ai-logs"
          className="inline-flex items-center gap-1.5 text-xs text-onSurface-muted hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>กลับสู่รายการ AI Logs ทั้งหมด</span>
        </Link>

        {/* Main Log Card */}
        <div className="p-6 md:p-8 rounded-3xl bg-surface-card border border-outline/30 shadow-level2 space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-outline/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-heading font-extrabold text-base md:text-lg text-onSurface">
                  รายละเอียดการสนทนา (AI Query Log Detail)
                </h1>
                <p className="text-xs font-mono text-onSurface-muted">
                  Log ID: {log.log_id}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MarkAsGapButton
                logId={log.log_id}
                isMarked={log.is_marked_gap}
                onSuccess={() => setLog(prev => prev ? { ...prev, is_marked_gap: true } : null)}
              />
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-surface border border-outline/20 text-xs">
            <div>
              <span className="text-[10px] text-onSurface-muted block">เวลาที่ถาม</span>
              <span className="font-mono text-onSurface font-medium">
                {new Date(log.created_at).toLocaleString('th-TH')}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-onSurface-muted block">เวลาประมวลผล</span>
              <span className="font-mono text-onSurface font-medium flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" />
                <span>{log.response_time_ms} ms</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] text-onSurface-muted block">ผู้ถาม</span>
              <span className="font-mono text-onSurface font-medium truncate block">
                {log.matched_user_name ? `${log.matched_user_name}` : 'ผู้ใช้ LINE ทั่วไป'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-onSurface-muted block">ฝ่ายงาน</span>
              <span className="text-onSurface font-medium truncate block">
                {log.department_name || 'ส่วนกลาง'}
              </span>
            </div>
          </div>

          {/* Question */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-onSurface flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-primary" />
              <span>ข้อความคำถาม (User Question):</span>
            </label>
            <div className="p-4 rounded-2xl bg-primary-container/40 text-onPrimaryContainer font-medium leading-relaxed border border-primary/20 text-sm">
              {log.question_text}
            </div>
          </div>

          {/* Confidence Score Bar */}
          <div className="p-4 rounded-2xl bg-surface border border-outline/20 space-y-2">
            <label className="text-xs font-bold text-onSurface flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>คะแนนความมั่นใจ (Confidence Score):</span>
            </label>
            <ConfidenceScoreBar score={log.confidence_score} />
          </div>

          {/* Retrieved Sources */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-onSurface flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span>แหล่งอ้างอิงที่ระบบใช้อ้างอิง (Retrieved Knowledge Sources):</span>
            </label>
            {log.sources && log.sources.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {log.sources.map((s, i) => (
                  <RetrievedSourceCard
                    key={s.source_id || i}
                    knowledgeId={s.knowledge_id}
                    title={s.title}
                    contentType={s.content_type}
                    departmentName={s.department_name}
                    relevanceScore={s.relevance_score}
                    rank={s.rank}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-onSurface-muted italic">
                ไม่พบแหล่งอ้างอิงที่มีความเกี่ยวข้องเพียงพอ (Fallback Response)
              </p>
            )}
          </div>

          {/* Answer */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-onSurface flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-primary" />
              <span>คำตอบที่ระบบสร้างและส่งกลับ (Generated Answer):</span>
            </label>
            <div
              className={`p-5 rounded-2xl leading-relaxed whitespace-pre-wrap text-sm ${
                log.is_fallback
                  ? 'bg-[#FBE9E7] text-[#B3261E] border border-[#B3261E]/30'
                  : 'bg-surface border border-outline/30 text-onSurface'
              }`}
            >
              {log.answer_text}
            </div>
          </div>

          {/* Feedback */}
          <div className="pt-4 border-t border-outline/20 flex items-center justify-between">
            <span className="text-xs font-semibold text-onSurface">ผลการประเมินจากผู้ใช้งาน:</span>
            <FeedbackBadge
              feedback={log.feedback}
              interactive={true}
              onSelect={handleFeedback}
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
