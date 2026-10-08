'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Loader2, Sparkles, Clock, RefreshCw, AlertTriangle, Volume2, Mic, MicOff, Square, FileText, ExternalLink } from 'lucide-react';
import ConfidenceScoreBar from './ConfidenceScoreBar';
import RetrievedSourceCard from './RetrievedSourceCard';
import { RAGPlaygroundResult } from '@/types/ai';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  result?: RAGPlaygroundResult;
  isVoice?: boolean;
}

const SAMPLE_QUESTIONS = [
  'ค่าเทอมจ่ายตี้ไหนเจ้า',
  'เปิดเทอมวันใด แล้วต้องเตรียมอะหยังพ่อง',
  'ครูแผนกช่างยนต์มีไผพ่องเจ้า',
  'ขอฟอร์มลาป่วยยะจะได',
  'โครงสร้างการบริหารวิทยาลัยการอาชีพฝางมีฝ่ายใดบ้าง',
  'ระเบียบการลงทะเบียนเรียนและเอกสารที่ต้องใช้'
];

export default function PlaygroundChatWindow() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'สวัสดีครับ/ค่ะ ยินดีต้อนรับสู่โหมดทดสอบ AI Playground (จำลองการทำงานบน LINE Official Account) รองรับทั้งการพิมพ์และส่งเสียงพูดภาษาถิ่นเหนือ (คำเมือง) ระบบทำงานเหมือน LINE OA จริง: หากถามด้วยเสียงจะตอบกลับด้วยไฟล์เสียงพูด และหากถามด้วยข้อความจะตอบเป็นข้อความครับ/ค่ะ',
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await handleSendAudio(audioBlob, mimeType);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds(prev => prev + 1);
      }, 1000);
    } catch (err: any) {
      alert('ไม่สามารถเข้าถึงไมโครโฟนได้: ' + (err.message || 'กรุณาอนุญาตการใช้งานไมโครโฟนในเบราว์เซอร์'));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleSendAudio = async (blob: Blob, mimeType: string) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      const userMsgId = 'usr-voice-' + Date.now();
      const nowTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

      setMessages(prev => [
        ...prev,
        {
          id: userMsgId,
          sender: 'user',
          text: '🎙️ ส่งคลิปเสียงพูดภาษาเหนือ/คำเมือง (กำลังถอดเสียง...)',
          timestamp: nowTime,
          isVoice: true
        }
      ]);
      setLoading(true);

      try {
        const res = await fetch('/api/ai-engine/playground', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioBase64: base64Audio, audioMimeType: mimeType })
        });

        const data = await res.json();
        if (res.ok && data.result) {
          // Update user message with transcribed question
          if (data.result.transcribedQuestion) {
            setMessages(prev => prev.map(m => m.id === userMsgId ? {
              ...m,
              text: `🎙️ "${data.result.transcribedQuestion}"`
            } : m));
          }

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
              text: `เกิดข้อผิดพลาดในการประมวลผลเสียง: ${data.error || 'ไม่สามารถประมวลผลได้'}`,
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
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'welcome',
        sender: 'ai',
        text: 'รีเซ็ตการสนทนาทดสอบเรียบร้อยแล้ว พิมพ์หรือส่งเสียงคำถามใหม่ได้เลยครับ',
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

                {/* Spoken Audio Reply Player if available */}
                {msg.result?.audioUrl && (
                  <div className="p-3 rounded-2xl bg-surface-card border border-primary/25 shadow-sm space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                        <Volume2 className="w-4 h-4 text-primary" />
                        <span>เสียงตอบกลับ AI (Audio Delivery)</span>
                      </div>
                      {msg.result.detectedDialect === 'kham_mueang' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/30">
                          🗣️ สำเนียงคำเมือง
                        </span>
                      )}
                    </div>
                    <audio
                      controls
                      src={msg.result.audioUrl}
                      className="w-full h-8 accent-primary"
                    />
                  </div>
                )}

                {/* Multi-Teacher Carousel / Gallery Preview */}
                {msg.result?.matchedTeachers && msg.result.matchedTeachers.length > 1 ? (
                  <div className="p-3.5 rounded-2xl bg-surface-card border border-outline/30 shadow-sm space-y-2.5 animate-fadeIn max-w-xl">
                    <div className="flex items-center justify-between text-xs font-semibold text-onSurface">
                      <span className="flex items-center gap-1.5 text-primary font-bold">
                        คณาจารย์และบุคลากร ({msg.result.matchedTeachers.length} ท่าน)
                      </span>
                      <span className="text-[11px] text-onSurface-muted">
                        เลื่อนดูภาพ ➔
                      </span>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth">
                      {msg.result.matchedTeachers.map((teacher, tIdx) => {
                        const proxiedUrl = teacher.imageUrl.includes('googleusercontent.com') || teacher.imageUrl.includes('drive.google.com')
                          ? `/api/media-proxy?url=${encodeURIComponent(teacher.imageUrl)}`
                          : teacher.imageUrl;
                        return (
                          <div
                            key={teacher.file_id || tIdx}
                            className="flex-shrink-0 w-36 rounded-2xl bg-surface/60 border border-outline/20 p-2.5 flex flex-col items-center text-center group hover:border-primary/50 transition-all cursor-pointer shadow-2xs"
                            onClick={() => window.open(proxiedUrl, '_blank')}
                            title="คลิกเพื่อดูภาพขนาดเต็ม"
                          >
                            <div className="w-24 h-28 rounded-xl overflow-hidden bg-black/5 mb-2 relative">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={proxiedUrl}
                                referrerPolicy="no-referrer"
                                alt={teacher.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  const currentSrc = e.currentTarget.getAttribute('src') || '';
                                  if (!currentSrc.includes('/api/media-proxy') && (currentSrc.includes('googleusercontent.com') || currentSrc.includes('drive.google.com'))) {
                                    e.currentTarget.src = `/api/media-proxy?url=${encodeURIComponent(currentSrc)}`;
                                  }
                                }}
                              />
                            </div>
                            <p className="text-xs font-bold text-onSurface line-clamp-1 w-full" title={teacher.name}>
                              {teacher.name}
                            </p>
                            <p className="text-[10px] text-onSurface-muted line-clamp-1 w-full mt-0.5" title={teacher.department}>
                              {teacher.department.replace(/^รายชื่อครูและบุคลากรสาขาวิชา/i, '').replace(/^สาขาวิชา/i, '').trim()}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : msg.result?.imageUrl ? (
                  <div className="p-3 rounded-2xl bg-surface-card border border-outline/30 shadow-sm space-y-2 animate-fadeIn max-w-sm">
                    <div className="flex items-center justify-between text-xs font-semibold text-onSurface">
                      <span className="flex items-center gap-1.5 text-primary">
                        🖼️ {msg.result.isWebAttachment ? 'ภาพจากฐานความรู้ (หน้าเว็บ)' : 'ภาพประกอบ (Google Drive)'}
                      </span>
                      {msg.result.imageCaption && (
                        <span className="text-[11px] text-onSurface-muted truncate max-w-[150px]">
                          {msg.result.imageCaption}
                        </span>
                      )}
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        msg.result.imageUrl.includes('googleusercontent.com') || msg.result.imageUrl.includes('drive.google.com')
                          ? `/api/media-proxy?url=${encodeURIComponent(msg.result.imageUrl)}`
                          : msg.result.imageUrl
                      }
                      referrerPolicy="no-referrer"
                      alt={msg.result.imageCaption || 'ภาพประกอบ'}
                      className="w-full max-h-60 object-contain rounded-xl bg-black/5 border border-outline/10 cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => {
                        const viewUrl = msg.result?.imageUrl?.includes('googleusercontent.com')
                          ? `/api/media-proxy?url=${encodeURIComponent(msg.result.imageUrl)}`
                          : msg.result?.imageUrl;
                        if (viewUrl) window.open(viewUrl, '_blank');
                      }}
                      title="คลิกเพื่อดูภาพขนาดเต็ม"
                      onError={(e) => {
                        const currentSrc = e.currentTarget.getAttribute('src') || '';
                        if (!currentSrc.includes('/api/media-proxy') && (currentSrc.includes('googleusercontent.com') || currentSrc.includes('drive.google.com'))) {
                          e.currentTarget.src = `/api/media-proxy?url=${encodeURIComponent(currentSrc)}`;
                        } else {
                          const parent = e.currentTarget.parentElement;
                          if (parent) parent.style.display = 'none';
                        }
                      }}
                    />
                  </div>
                ) : null}

                {/* Document / PDF Attachment Preview if available */}
                {msg.result?.documentAttachment && msg.result.documentAttachment.file_url && !msg.result.documentAttachment.file_url.includes('/folders/') && (
                  <div className="p-3 rounded-2xl bg-surface-card border border-outline/30 shadow-sm space-y-2 animate-fadeIn max-w-sm">
                    <div className="flex items-center justify-between text-xs font-semibold text-onSurface">
                      <span className="flex items-center gap-1.5 text-primary">
                        <FileText className="w-4 h-4 text-primary" /> เอกสารแนบ ({msg.result.documentAttachment.file_type?.toUpperCase() || 'PDF'})
                      </span>
                      {msg.result.documentAttachment.file_size_kb && (
                        <span className="text-[11px] text-onSurface-muted">
                          {msg.result.documentAttachment.file_size_kb} KB
                        </span>
                      )}
                    </div>
                    <a
                      href={msg.result.documentAttachment.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-xl bg-primary/5 hover:bg-primary/10 border border-primary/20 transition-colors text-xs text-primary font-medium group"
                    >
                      <span className="truncate max-w-[200px]">{msg.result.documentAttachment.file_name}</span>
                      <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 ml-1.5 group-hover:scale-110 transition-transform" />
                    </a>
                  </div>
                )}

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
              <span>AI กำลังค้นหาองค์ความรู้ ถอดเสียง และสังเคราะห์คำตอบ...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar with Voice Recording */}
      <div className="p-3 bg-surface-card border-t border-outline/20">
        {isRecording ? (
          <div className="flex items-center justify-between gap-3 p-2 bg-red-50 dark:bg-red-950/20 border border-red-300 dark:border-red-800 rounded-2xl animate-pulse">
            <div className="flex items-center gap-2.5 text-red-600 dark:text-red-400 text-xs font-semibold px-2">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <span>กำลังอัดเสียงพูด (คำเมือง/ภาษากลาง)... 0:{recordingSeconds < 10 ? '0' : ''}{recordingSeconds}</span>
            </div>
            <button
              type="button"
              onClick={stopRecording}
              className="h-9 px-4 rounded-xl bg-red-600 text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-red-700 transition-all shadow-sm"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>หยุดและส่งเสียง</span>
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={startRecording}
              disabled={loading}
              className="w-11 h-11 rounded-2xl border border-outline bg-surface-card hover:bg-surface-variant text-primary flex items-center justify-center transition-all disabled:opacity-40 flex-shrink-0 shadow-sm"
              title="กดเพื่ออัดเสียงพูดภาษาเหนือ/คำเมือง (Voice Input)"
            >
              <Mic className="w-5 h-5 text-primary" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="พิมพ์คำถาม หรือกดไมค์เพื่อพูดภาษาเหนือ (เช่น 'ค่าเทอมจ่ายตี้ไหนเจ้า')..."
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
        )}
      </div>
    </div>
  );
}
