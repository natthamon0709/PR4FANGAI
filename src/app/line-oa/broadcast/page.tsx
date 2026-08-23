'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import BroadcastSourceSelector from '@/components/line/BroadcastSourceSelector';
import AudienceSelector from '@/components/line/AudienceSelector';
import LineMessagePreviewBubble from '@/components/line/LineMessagePreviewBubble';
import BroadcastHistoryList from '@/components/line/BroadcastHistoryList';
import SessionAlert from '@/components/SessionAlert';
import { SessionUser } from '@/types';
import { LineBroadcast, BroadcastTargetType } from '@/types/line';
import { Send, Clock, Sparkles, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function BroadcastPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [knowledgeList, setKnowledgeList] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [broadcasts, setBroadcasts] = useState<LineBroadcast[]>([]);
  const [totalFollowers, setTotalFollowers] = useState(3842);
  const [linkedStaffCount, setLinkedStaffCount] = useState(3);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [sourceType, setSourceType] = useState<'knowledge' | 'manual'>('knowledge');
  const [selectedKnowledgeId, setSelectedKnowledgeId] = useState('');
  const [title, setTitle] = useState('');
  const [messageText, setMessageText] = useState('');
  const [targetType, setTargetType] = useState<BroadcastTargetType>('all_followers');
  const [departmentId, setDepartmentId] = useState('');
  const [sendImmediately, setSendImmediately] = useState(true);
  const [scheduledAt, setScheduledAt] = useState('');

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

        // Load published knowledge for source selector
        const kmRes = await fetch('/api/knowledge?limit=50&status=published');
        if (kmRes.ok) {
          const kmData = await kmRes.json();
          setKnowledgeList(kmData.items || []);
          if (kmData.items?.length > 0) {
            const first = kmData.items[0];
            setSelectedKnowledgeId(first.knowledge_id);
            setTitle(first.title);
            setMessageText(first.summary || first.content?.substring(0, 300) || '');
          }
        }

        // Load departments
        const deptRes = await fetch('/api/departments');
        if (deptRes.ok) {
          const deptData = await deptRes.json();
          setDepartments(deptData.departments || []);
        }

        // Load broadcasts & overview stats
        const bcRes = await fetch('/api/line-oa/broadcast');
        if (bcRes.ok) {
          const bcData = await bcRes.json();
          setBroadcasts(bcData.broadcasts || []);
        }

        const overviewRes = await fetch('/api/line-oa/overview');
        if (overviewRes.ok) {
          const ovData = await overviewRes.json();
          setTotalFollowers(ovData.stats?.totalFollowers || 3842);
          setLinkedStaffCount(ovData.stats?.linkedStaffCount || 3);
        }
      } catch (err: any) {
        setAlertMsg({ type: 'error', text: err.message });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleSelectKnowledge = (id: string) => {
    setSelectedKnowledgeId(id);
    const item = knowledgeList.find(k => k.knowledge_id === id);
    if (item) {
      setTitle(item.title);
      setMessageText(item.summary || item.content?.substring(0, 300) || '');
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setAlertMsg(null);

    try {
      const res = await fetch('/api/line-oa/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message_text: messageText,
          source_knowledge_id: sourceType === 'knowledge' ? selectedKnowledgeId : null,
          target_type: targetType,
          department_id: targetType === 'linked_staff_department' ? departmentId : null,
          scheduled_at: !sendImmediately ? scheduledAt : null,
          send_immediately: sendImmediately
        })
      });

      const data = await res.json();
      if (res.ok) {
        setAlertMsg({ type: 'success', text: data.message });
        // Refresh broadcast list
        const bcRes = await fetch('/api/line-oa/broadcast');
        const bcData = await bcRes.json();
        setBroadcasts(bcData.broadcasts || []);
      } else {
        setAlertMsg({ type: 'error', text: data.error });
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message });
    } finally {
      setSending(false);
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const isAdmin = currentUser.role === 'administrator';

  return (
    <DashboardLayout
      user={currentUser}
      breadcrumbs={[
        { label: 'LINE OA', href: '/line-oa' },
        { label: 'ส่งข้อความประชาสัมพันธ์ (Broadcast)' },
      ]}
    >
      <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline/20">
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-extrabold text-onSurface flex items-center gap-2.5">
              <Send className="w-6 h-6 text-primary" />
              <span>ส่งข้อความประชาสัมพันธ์ (Broadcast Messaging)</span>
            </h1>
            <p className="text-xs text-onSurface-muted mt-0.5">
              ส่งข่าวสาร ระเบียบ หรือประกาศสำคัญไปยัง LINE ของผู้ติดตามทั้งหมด หรือเจ้าหน้าที่เฉพาะฝ่าย
            </p>
          </div>

          <Link
            href="/line-oa"
            className="h-10 px-3.5 rounded-xl border border-outline bg-surface-card hover:bg-surface-variant text-xs font-semibold text-onSurface flex items-center gap-1.5 shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>กลับหน้าภาพรวม</span>
          </Link>
        </div>

        {alertMsg && (
          <SessionAlert
            type={alertMsg.type}
            message={alertMsg.text}
            onClose={() => setAlertMsg(null)}
          />
        )}

        {/* Form and Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form (7 cols) */}
          <form onSubmit={handleSendBroadcast} className="lg:col-span-7 p-6 rounded-3xl bg-surface-card border border-outline/30 shadow-level1 space-y-5">
            {/* 1. Source Selector (C77) */}
            <BroadcastSourceSelector
              sourceType={sourceType}
              onSourceTypeChange={setSourceType}
              knowledgeList={knowledgeList}
              selectedKnowledgeId={selectedKnowledgeId}
              onSelectKnowledge={handleSelectKnowledge}
              disabled={sending}
            />

            {/* Title & Message inputs */}
            <div className="space-y-3 pt-2 border-t border-outline/15">
              <div>
                <label className="block text-xs font-semibold text-onSurface mb-1">
                  หัวข้อประกาศ (Title) <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  disabled={sending}
                  placeholder="เช่น ประกาศเปิดรับสมัครนักเรียนใหม่..."
                  className="w-full h-10 px-3.5 rounded-xl border border-outline bg-surface text-xs text-onSurface outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-onSurface mb-1">
                  เนื้อหาข้อความบน LINE (Message Text) <span className="text-error">*</span>
                </label>
                <textarea
                  rows={5}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  required
                  disabled={sending}
                  placeholder="ระบุข้อความที่จะส่ง..."
                  className="w-full p-3.5 rounded-2xl border border-outline bg-surface text-xs text-onSurface leading-relaxed outline-none focus:border-primary resize-y"
                />
              </div>
            </div>

            {/* 2. Target Audience Selector (C79) */}
            <div className="pt-2 border-t border-outline/15">
              <AudienceSelector
                targetType={targetType}
                onTargetTypeChange={setTargetType}
                departmentId={departmentId}
                onDepartmentChange={setDepartmentId}
                departments={departments}
                totalFollowersCount={totalFollowers}
                linkedStaffCount={linkedStaffCount}
                isAdmin={isAdmin}
                disabled={sending}
              />
            </div>

            {/* 3. Send Timing Options */}
            <div className="pt-2 border-t border-outline/15 space-y-2">
              <label className="text-xs font-bold text-onSurface block">
                เวลาที่ต้องการส่ง (Delivery Timing):
              </label>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs font-semibold text-onSurface cursor-pointer">
                  <input
                    type="radio"
                    name="timing"
                    checked={sendImmediately}
                    onChange={() => setSendImmediately(true)}
                    disabled={sending}
                    className="accent-primary"
                  />
                  <span>ส่งทันที (Send Immediately)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-onSurface cursor-pointer">
                  <input
                    type="radio"
                    name="timing"
                    checked={!sendImmediately}
                    onChange={() => setSendImmediately(false)}
                    disabled={sending}
                    className="accent-primary"
                  />
                  <span>ตั้งเวลาส่งล่วงหน้า (Schedule)</span>
                </label>
              </div>

              {!sendImmediately && (
                <div className="pt-2">
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    required={!sendImmediately}
                    disabled={sending}
                    className="h-10 px-3 rounded-xl border border-outline bg-surface text-xs text-onSurface outline-none focus:border-primary"
                  />
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-3 border-t border-outline/20 flex items-center justify-end gap-3">
              <button
                type="submit"
                disabled={sending}
                className="h-11 px-6 rounded-2xl bg-primary text-onPrimary font-semibold text-xs md:text-sm flex items-center gap-2 hover:bg-primary-hover shadow-level1 transition-all disabled:opacity-50"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{sendImmediately ? 'ยืนยันและส่งข้อความ Broadcast ทันที' : 'บันทึกการตั้งเวลาส่ง'}</span>
              </button>
            </div>
          </form>

          {/* Right Column: Live Message Preview Bubble (C78) (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <LineMessagePreviewBubble
              title={title}
              messageText={messageText}
            />

            <div className="p-4 rounded-2xl bg-surface-card border border-outline/30 text-xs text-onSurface-muted space-y-2">
              <span className="font-bold text-onSurface block">📌 ข้อแนะนำการส่ง Broadcast:</span>
              <p>• ข้อความจะถูกแบ่งส่งเป็นชุดละไม่เกิน 500 คนอัตโนมัติตามโควตา LINE API</p>
              <p>• หลีกเลี่ยงการส่งข้อความบ่อยเกินความจำเป็นเพื่อรักษาความพึงพอใจของผู้ติดตาม</p>
            </div>
          </div>
        </div>

        {/* Broadcast History List (C73) */}
        <div className="pt-4 space-y-3">
          <h3 className="font-heading font-bold text-sm text-onSurface flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>ประวัติการส่ง Broadcast ทั้งหมด ({broadcasts.length} รายการ)</span>
          </h3>
          <BroadcastHistoryList broadcasts={broadcasts} showCreateButton={false} />
        </div>
      </div>
    </DashboardLayout>
  );
}
