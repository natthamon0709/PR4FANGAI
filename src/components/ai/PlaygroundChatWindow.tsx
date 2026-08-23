'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Loader2, Sparkles, Clock, RefreshCw, AlertTriangle } from 'lucide-react';
import ConfidenceScoreBar from './ConfidenceScoreBar';
import RetrievedSourceCard from './RetrievedSourceCard';
import { RAGPlaygroundResult } from '@/types/ai';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  result?: RAGPlaygroundResult;
}

const SAMPLE_QUESTIONS = [
  'ขอฟอร์มลาป่วยต้องยื่นล่วงหน้ากี่วัน',
  'โครงสร้างการบริหารวิทยาลัยการอาชีพฝางมีฝ่ายใดบ้าง',
  'รายชื่อครูและบุคลากรสาขาวิชาการบัญชี',
  'ระเบียบการลงทะเบียนเรียนและเอกสารที่ต้องใช้'
];

export default function PlaygroundChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'สวัสดีครับ/ค่ะ ยินดีต้อนรับสู่โหมดทดสอบ AI Playground (จำลองการทำงานบน LINE Official Account) คุณสามารถพิมพ์คำถามเพื่อทดสอบการค้นหาองค์ความรู้และประมวลผลคำตอบได้ทันทีครับ',
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (questionToSend?: string) => {
    const text = (questionToSend || input).trim();
    if (!text || loading) return;

    const userMsgId = 'usr-' + Date.now();
    const nowTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    setMessages(prev => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text,
        timestamp: nowTime
      }
    ]);
    if (!questionToSend) setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-engine/playground', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text })
      });

      const data = await res.json();
      if (res.ok && data.result) {
        setMessages(prev => [
          ...prev,
          {
            id: 'ai-' + Date.now(),
            sender: 'ai',
            text: data.result.answer,
            timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            result: data.result
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: 'ai-err-' + Date.now(),
            sender: 'ai',
            text: `เกิดข้อผิดพลาดในการประมวลผล: ${data.error || 'ไม่สามารถเชื่อมต่อ AI Engine ได้'}`,
            timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: 'ai-err-' + Date.now(),
          sender: 'ai',
          text: `เกิดข้อผิดพลาดในการเชื่อมต่อ: ${err.message}`,
          timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: 'รีเซ็ตการสนทนาทดสอบเรียบร้อยแล้ว พิมพ์คำถามใหม่ได้เลยครับ',
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="flex flex-col h-[650px] max-h-[80vh] rounded-3xl bg-surface-card border border-outline/30 shadow-level2 overflow-hidden">
      {/* Header Bar */}
      <div className="px-5 py-3.5 bg-surface-variant/40 border-b border-outline/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-onPrimary shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-bold text-sm text-onSurface">
                PR4Fang AI Assistant
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#06C755]/10 text-[#06C755] border border-[#06C755]/30">
                LINE OA Preview
              </span>
            </div>
            <p className="text-[11px] text-onSurface-muted">
              โหมดทดสอบ RAG Pipeline (ไม่บันทึกลงสถิติ AI Logs จริง)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClear}
          className="p-2 rounded-xl text-onSurface-muted hover:text-onSurface hover:bg-surface-variant transition-colors"
          title="ล้างข้อความการทดสอบ"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Suggested Quick Questions */}
      <div className="px-4 py-2 bg-surface border-b border-outline/15 overflow-x-auto flex items-center gap-2 text-xs no-scrollbar">
        <span className="text-[11px] text-onSurface-muted font-medium flex-shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-primary" />
          <span>ตัวอย่างคำถาม:</span>
        </span>
        {SAMPLE_QUESTIONS.map((q, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleSend(q)}
            disabled={loading}
            className="flex-shrink-0 px-2.5 py-1 rounded-full bg-surface-variant/60 hover:bg-primary-container/40 text-onSurface-muted hover:text-primary text-[11px] border border-outline/20 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 p-4 md:p-5 overflow-y-auto space-y-4 bg-surface/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-fadeIn`}
          >
            <div className={`flex items-start gap-2.5 max-w-[88%] sm:max-w-[80%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar Icon */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs shadow-sm mt-0.5 ${
                  msg.sender === 'user'
                    ? 'bg-primary text-onPrimary'
                    : 'bg-surface-card border border-outline/30 text-primary'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className="space-y-2">
                <div
                  className={`p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-primary-container text-onPrimaryContainer rounded-2xl rounded-tr-none font-medium'
                      : 'bg-surface-card text-onSurface rounded-2xl rounded-tl-none border border-outline/20'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>

                {/* AI Metadata: Confidence Bar & Retrieved Sources */}
                {msg.result && (
                  <div className="p-3 rounded-2xl bg-surface-card border border-outline/30 shadow-level1 space-y-2.5 max-w-full text-xs animate-fadeIn">
                    {/* Confidence Score Bar (C67) */}
                    <ConfidenceScoreBar score={msg.result.confidence_score} size="sm" />

                    {/* Fallback Notice if triggered */}
                    {msg.result.is_fallback && (
                      <div className="p-2 rounded-xl bg-[#FBE9E7] text-[#B3261E] text-[11px] font-medium flex items-center gap-1.5 border border-[#B3261E]/20">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>ความมั่นใจต่ำกว่าเกณฑ์ ➔ สลับเป็นข้อความ Fallback</span>
                      </div>
                    )}

                    {/* Retrieved Sources Chips (C66) */}
                    {msg.result.sources && msg.result.sources.length > 0 && (
                      <div className="space-y-1.5 pt-1 border-t border-outline/15">
                        <span className="text-[10px] text-onSurface-muted font-semibold uppercase tracking-wider block">
                          แหล่งอ้างอิงที่ค้นพบ ({msg.result.sources.length} รายการ):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.result.sources.map((s, idx) => (
                            <RetrievedSourceCard
                              key={s.knowledge_id || idx}
                              knowledgeId={s.knowledge_id}
                              title={s.title}
                              contentType={s.content_type}
                              departmentName={s.department_name}
                              relevanceScore={s.relevance_score}
                              rank={s.rank}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Response Time Badge */}
                    <div className="flex justify-end text-[10px] font-mono text-onSurface-muted items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>ประมวลผล: {msg.result.response_time_ms} ms</span>
                    </div>
                  </div>
                )}

                {/* Timestamp */}
                <div className={`text-[10px] text-onSurface-muted px-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2.5 animate-fadeIn">
            <div className="w-7 h-7 rounded-full bg-surface-card border border-outline/30 flex items-center justify-center text-primary flex-shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl rounded-tl-none bg-surface-card border border-outline/20 text-xs text-onSurface flex items-center gap-2 shadow-sm">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>AI กำลังค้นหาองค์ความรู้และสังเคราะห์คำตอบ...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="p-3 bg-surface-card border-t border-outline/20 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="พิมพ์คำถามทดสอบระบบ AI (เช่น ถามเรื่องระเบียบ, ประกาศ, ข้อมูลฝ่าย)..."
          disabled={loading}
          className="flex-1 h-11 px-4 rounded-2xl border border-outline bg-surface text-sm text-onSurface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="h-11 px-5 rounded-2xl bg-primary text-onPrimary font-semibold text-xs md:text-sm flex items-center gap-2 hover:bg-primary-hover transition-all disabled:opacity-40 shadow-level1 flex-shrink-0"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">ส่งคำถาม</span>
        </button>
      </form>
    </div>
  );
}
