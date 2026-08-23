'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import AiProviderSelector from '@/components/ai/AiProviderSelector';
import ApiKeyMaskedInput from '@/components/ai/ApiKeyMaskedInput';
import SystemPromptEditor from '@/components/ai/SystemPromptEditor';
import ConfidenceThresholdSlider from '@/components/ai/ConfidenceThresholdSlider';
import TopKStepper from '@/components/ai/TopKStepper';
import TemperatureSlider from '@/components/ai/TemperatureSlider';
import SessionAlert from '@/components/SessionAlert';
import { SessionUser } from '@/types';
import { AiProvider, AiEngineConfig } from '@/types/ai';
import { Settings, Save, Play, Loader2, Sparkles, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function AiEngineSettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form States
  const [provider, setProvider] = useState<AiProvider>('gemini');
  const [modelName, setModelName] = useState('gemini-2.5-flash');
  const [maskedKey, setMaskedKey] = useState('••••••••4f2a');
  const [newKey, setNewKey] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.70);
  const [retrievalTopK, setRetrievalTopK] = useState(5);
  const [temperature, setTemperature] = useState(0.3);

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

        if (userData.user.role !== 'administrator') {
          router.push('/ai-engine/playground');
          return;
        }

        const configRes = await fetch('/api/ai-engine/config');
        if (configRes.ok) {
          const { config } = await configRes.json();
          setProvider(config.provider || 'gemini');
          setModelName(config.model_name || 'gemini-2.5-flash');
          setMaskedKey(config.api_key_masked || '••••••••4f2a');
          setSystemPrompt(config.system_prompt || '');
          setConfidenceThreshold(config.confidence_threshold ?? 0.70);
          setRetrievalTopK(config.retrieval_top_k ?? 5);
          setTemperature(config.temperature ?? 0.3);
        }
      } catch (err: any) {
        setAlertMsg({ type: 'error', text: err.message });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setAlertMsg(null);

    try {
      const res = await fetch('/api/ai-engine/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          model_name: modelName,
          api_key: newKey || undefined,
          system_prompt: systemPrompt,
          confidence_threshold: confidenceThreshold,
          retrieval_top_k: retrievalTopK,
          temperature: temperature
        })
      });

      const data = await res.json();
      if (res.ok) {
        setAlertMsg({ type: 'success', text: data.message });
        if (data.config?.api_key_masked) {
          setMaskedKey(data.config.api_key_masked);
        }
        setNewKey('');
      } else {
        setAlertMsg({ type: 'error', text: data.error });
      }
    } catch (err: any) {
      setAlertMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout
      user={currentUser}
      breadcrumbs={[
        { label: 'ระบบปัญญาประดิษฐ์ (AI Engine)' },
        { label: 'ตั้งค่าเครื่องมือ AI (Settings)' },
      ]}
    >
      <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-outline/20">
          <div>
            <h1 className="text-xl md:text-2xl font-heading font-extrabold text-onSurface flex items-center gap-2.5">
              <Settings className="w-6 h-6 text-primary" />
              <span>ตั้งค่าเครื่องมือ AI (AI Engine Settings)</span>
            </h1>
            <p className="text-xs text-onSurface-muted mt-0.5">
              กำหนดผู้ให้บริการ AI, โมเดล, คำสั่งควบคุมพฤติกรรม และเกณฑ์ความมั่นใจขั้นต่ำสำหรับ RAG Pipeline
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/ai-engine/playground"
              className="h-10 px-4 rounded-xl border border-outline bg-surface-card hover:bg-surface-variant text-xs font-semibold text-onSurface flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Play className="w-4 h-4 text-primary" />
              <span>ทดสอบใน Playground</span>
            </Link>
          </div>
        </div>

        {alertMsg && (
          <SessionAlert
            type={alertMsg.type}
            message={alertMsg.text}
            onClose={() => setAlertMsg(null)}
          />
        )}

        {/* Settings Form & Helper Sidebar */}
        <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Controls (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card 1: Provider & API Key (C59, C60) */}
            <div className="p-5 md:p-6 rounded-3xl bg-surface-card border border-outline/30 shadow-level1 space-y-5">
              <h3 className="font-heading font-bold text-sm text-onSurface flex items-center gap-2 pb-2 border-b border-outline/15">
                <Sparkles className="w-4 h-4 text-primary" />
                <span>1. ผู้ให้บริการและโมเดล AI (Provider & Model)</span>
              </h3>

              <AiProviderSelector
                provider={provider}
                modelName={modelName}
                onProviderChange={setProvider}
                onModelChange={setModelName}
                disabled={saving}
              />

              <ApiKeyMaskedInput
                maskedKey={maskedKey}
                onChangeKey={(key) => setNewKey(key)}
                disabled={saving}
              />
            </div>

            {/* Card 2: System Prompt (C61) */}
            <div className="p-5 md:p-6 rounded-3xl bg-surface-card border border-outline/30 shadow-level1 space-y-4">
              <h3 className="font-heading font-bold text-sm text-onSurface flex items-center gap-2 pb-2 border-b border-outline/15">
                <Settings className="w-4 h-4 text-primary" />
                <span>2. บทบาทและคำสั่งควบคุม (System Prompt)</span>
              </h3>

              <SystemPromptEditor
                value={systemPrompt}
                onChange={setSystemPrompt}
                disabled={saving}
              />
            </div>

            {/* Card 3: Hyperparameters (C62, C63, C64) */}
            <div className="p-5 md:p-6 rounded-3xl bg-surface-card border border-outline/30 shadow-level1 space-y-5">
              <h3 className="font-heading font-bold text-sm text-onSurface flex items-center gap-2 pb-2 border-b border-outline/15">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>3. เกณฑ์ความแม่นยำและพารามิเตอร์ (RAG Parameters)</span>
              </h3>

              <ConfidenceThresholdSlider
                value={confidenceThreshold}
                onChange={setConfidenceThreshold}
                disabled={saving}
              />

              <TopKStepper
                value={retrievalTopK}
                onChange={setRetrievalTopK}
                disabled={saving}
              />

              <TemperatureSlider
                value={temperature}
                onChange={setTemperature}
                disabled={saving}
              />
            </div>

            {/* Submit Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Link
                href="/ai-engine/playground"
                className="h-11 px-5 rounded-2xl border border-outline bg-surface-card hover:bg-surface-variant text-xs md:text-sm font-semibold text-onSurface flex items-center gap-2 transition-colors"
              >
                <Play className="w-4 h-4 text-primary" />
                <span>ทดสอบใน Playground ก่อน</span>
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="h-11 px-6 rounded-2xl bg-primary text-onPrimary font-semibold text-xs md:text-sm flex items-center gap-2 hover:bg-primary-hover shadow-level1 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>บันทึกการตั้งค่า (มีผลทันที)</span>
              </button>
            </div>
          </div>

          {/* Right Sidebar: Guide & Architecture Notes */}
          <div className="space-y-5">
            <div className="p-5 rounded-3xl bg-surface-card border border-outline/30 shadow-level1 space-y-4">
              <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>สถาปัตยกรรม RAG Pipeline</span>
              </h4>

              <div className="space-y-3 text-xs text-onSurface-muted leading-relaxed">
                <div className="p-3 rounded-2xl bg-surface-variant/40 border border-outline/20">
                  <strong className="text-onSurface block mb-0.5">1. แหล่งข้อมูลเอกภาพ</strong>
                  อ่านจากฐานข้อมูล `Knowledge_Base` (Phase 3) เฉพาะรายการที่เผยแพร่และเปิดสิทธิ์ AI เท่านั้น
                </div>

                <div className="p-3 rounded-2xl bg-surface-variant/40 border border-outline/20">
                  <strong className="text-onSurface block mb-0.5">2. เกณฑ์ความมั่นใจ</strong>
                  เมื่อคะแนนต่ำกว่า <strong>{confidenceThreshold.toFixed(2)}</strong> ระบบจะตัดเข้า Fallback และส่งเข้า <strong>Knowledge Gap Log</strong> บน Dashboard ทันที
                </div>

                <div className="p-3 rounded-2xl bg-surface-variant/40 border border-outline/20">
                  <strong className="text-onSurface block mb-0.5">3. ความปลอดภัย Key</strong>
                  API Key ถูกเข้ารหัสแบบ AES-256 ในฐานข้อมูล ไม่มีการส่งข้อความ Key เต็มออกมาภายนอก
                </div>
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-primary-container/20 border border-primary/20 space-y-2">
              <h4 className="font-heading font-bold text-xs text-primary flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>คำแนะนำการปรับค่า</span>
              </h4>
              <p className="text-[11px] text-onSurface-muted leading-relaxed">
                หากพบว่า AI ตอบ "ไม่พบข้อมูล" บ่อยเกินไปแม้มีองค์ความรู้อยู่ ให้ลองปรับ <strong>Confidence Threshold ลดลงเล็กน้อย</strong> (เช่น 0.65) หรือเพิ่ม <strong>Retrieval Top-K เป็น 6-7</strong> แล้วทดสอบใน Playground
              </p>
            </div>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
