'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  RotateCcw,
  Maximize2,
  Minimize2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Info,
  Radio,
  Layers,
  ArrowRight,
  HelpCircle,
  Clock,
  Sparkle,
  Bluetooth
} from 'lucide-react';
import { RAGPlaygroundResult } from '@/types/ai';
import BluetoothConfigModal from '@/components/robot/BluetoothConfigModal';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  result?: RAGPlaygroundResult;
  isVoice?: boolean;
}

const QUICK_SUGGESTIONS = [
  { label: '📚 สาขาวิชาที่เปิดสอน', question: 'วิทยาลัยการอาชีพฝางมีสาขาวิชาอะไรบ้างครับ' },
  { label: '📝 การสมัครเรียน', question: 'สมัครเรียนต้องเตรียมเอกสารและคุณสมบัติอะไรบ้างครับ' },
  { label: '📍 เส้นทางและแผนที่', question: 'วิทยาลัยตั้งอยู่ที่ไหนและเดินทางไปอย่างไรครับ' },
  { label: '📅 วันเปิดภาคเรียน', question: 'เปิดเทอมวันใดครับ' },
  { label: '💰 ค่าธรรมเนียม/ค่าเทอม', question: 'ค่าเทอมจ่ายตี้ไหนและเท่าไหร่เจ้า' },
  { label: '🏢 ติดต่อสอบถาม', question: 'ต้องการติดต่อห้องประชาสัมพันธ์หรือฝ่ายวิชาการ' }
];

export default function RobotReceptionPage() {
  const [botGender, setBotGender] = useState<'female' | 'male'>('female');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [robotStatus, setRobotStatus] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeSources, setActiveSources] = useState<RAGPlaygroundResult['sources']>([]);
  const [showArchDiagram, setShowArchDiagram] = useState(false);
  const [showAside, setShowAside] = useState(true);
  const [systemReady, setSystemReady] = useState(true);
  const [isBtModalOpen, setIsBtModalOpen] = useState(false);
  const [btDeviceName, setBtDeviceName] = useState<string | null>(null);
  const [statusInfo, setStatusInfo] = useState<{
    model?: string;
    publishedKnowledgeCount?: number;
    provider?: string;
  }>({});

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // สร้างข้อความต้อนรับตามเพศของเสียงหุ่นยนต์
  const getWelcomeText = useCallback((gender: 'female' | 'male') => {
    return gender === 'female'
      ? 'ยินดีต้อนรับสู่วิทยาลัยการอาชีพฝางค่ะ! 😊\nหนูคือหุ่นยนต์ผู้ช่วยประชาสัมพันธ์อัตโนมัติ สอบถามข้อมูลการเรียน แผนกวิชา หรือการสมัครเรียนได้เลยค่ะ ท่านสามารถแตะปุ่มไมโครโฟนเพื่อพูดภาษาไทยหรือภาษาถิ่นเหนือ (คำเมือง) หรือพิมพ์ข้อความคำถามได้เลยนะคะ'
      : 'ยินดีต้อนรับสู่วิทยาลัยการอาชีพฝางครับ! 😊\nผมคือหุ่นยนต์ผู้ช่วยประชาสัมพันธ์อัตโนมัติ สอบถามข้อมูลการเรียน แผนกวิชา หรือการสมัครเรียนได้เลยครับ ท่านสามารถแตะปุ่มไมโครโฟนเพื่อพูดภาษาไทยหรือภาษาถิ่นเหนือ (คำเมือง) หรือพิมพ์ข้อความคำถามได้เลยครับ';
  }, []);

  // เลื่อนหน้าจอไปยังข้อความล่าสุด
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // ตรวจสอบสถานะระบบ & โหลดการตั้งค่าเพศและบลูทูธ
  useEffect(() => {
    const savedGender = localStorage.getItem('pr4fang_robot_gender') as 'female' | 'male' | null;
    const savedBt = localStorage.getItem('pr4fang_robot_bt_name');
    if (savedBt) setBtDeviceName(savedBt);

    async function checkStatus() {
      try {
        const res = await fetch('/api/robot/status');
        if (res.ok) {
          const data = await res.json();
          setSystemReady(data.ready);
          const initialGender: 'female' | 'male' = savedGender || data.voiceGender || 'female';
          setBotGender(initialGender);
          setMessages([
            {
              id: 'welcome-robot',
              sender: 'ai',
              text: getWelcomeText(initialGender),
              timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          setStatusInfo({
            model: data.model,
            publishedKnowledgeCount: data.publishedKnowledgeCount,
            provider: data.provider
          });
        } else {
          const initialGender = savedGender || 'female';
          setBotGender(initialGender);
          setMessages([
            {
              id: 'welcome-robot',
              sender: 'ai',
              text: getWelcomeText(initialGender),
              timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      } catch (e) {
        console.error('Cannot check robot status:', e);
        const initialGender = savedGender || 'female';
        setBotGender(initialGender);
        setMessages([
          {
            id: 'welcome-robot',
            sender: 'ai',
            text: getWelcomeText(initialGender),
            timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    }
    checkStatus();
  }, [getWelcomeText]);

  // สลับเพศเสียงของ Bot (หญิง/ชาย)
  const handleToggleGender = (newGender: 'female' | 'male') => {
    setBotGender(newGender);
    localStorage.setItem('pr4fang_robot_gender', newGender);

    // ปรับเปลี่ยนข้อความต้อนรับตามเพศใหม่หากยังไม่มีการคุยเยอะ
    setMessages((prev) =>
      prev.map((m) =>
        m.id.startsWith('welcome-robot')
          ? {
              ...m,
              text: getWelcomeText(newGender)
            }
          : m
      )
    );
  };

  // เล่นเสียงตอบกลับอัตโนมัติ
  const playAudioReply = useCallback((url: string) => {
    if (!url) return;
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current = null;
      }
      const audio = new Audio(url);
      currentAudioRef.current = audio;
      setRobotStatus('speaking');

      audio.onended = () => {
        setRobotStatus('idle');
      };
      audio.onerror = () => {
        setRobotStatus('idle');
      };

      audio.play().catch((err) => {
        console.log('Audio autoplay blocked or waiting for user interaction:', err);
        setRobotStatus('idle');
      });
    } catch (err) {
      console.error('Play audio error:', err);
      setRobotStatus('idle');
    }
  }, []);

  // ส่งคำถามข้อความ
  const handleSend = async (questionToSend?: string) => {
    const text = (questionToSend || input).trim();
    if (!text || loading) return;

    if (!questionToSend) setInput('');
    const userMsgId = 'usr-' + Date.now();
    const nowTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        sender: 'user',
        text,
        timestamp: nowTime
      }
    ]);

    setLoading(true);
    setRobotStatus('thinking');

    try {
      const res = await fetch('/api/robot/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text,
          generateVoiceReply: true,
          voiceGender: botGender
        })
      });

      const data = await res.json();

      if (res.ok && data.result) {
        const resData: RAGPlaygroundResult = data.result;
        setMessages((prev) => [
          ...prev,
          {
            id: 'ai-' + Date.now(),
            sender: 'ai',
            text: resData.answer,
            timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
            result: resData
          }
        ]);

        if (resData.sources && resData.sources.length > 0) {
          setActiveSources(resData.sources);
        }

        // เล่นเสียงอัตโนมัติหากมี audioUrl และเปิด autoSpeak ไว้
        if (autoSpeak && resData.audioUrl) {
          playAudioReply(resData.audioUrl);
        } else {
          setRobotStatus('idle');
        }
      } else {
        const polite = botGender === 'female' ? 'ค่ะ' : 'ครับ';
        setMessages((prev) => [
          ...prev,
          {
            id: 'ai-err-' + Date.now(),
            sender: 'ai',
            text: `ขออภัย${polite} เกิดข้อผิดพลาดในการประมวลผล: ${data.error || 'ไม่สามารถติดต่อ AI Engine ได้'} กรุณาลองใหม่อีกครั้ง${polite}`,
            timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setRobotStatus('idle');
      }
    } catch (err: any) {
      const polite = botGender === 'female' ? 'ค่ะ' : 'ครับ';
      setMessages((prev) => [
        ...prev,
        {
          id: 'ai-err-' + Date.now(),
          sender: 'ai',
          text: `ขออภัย${polite} ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้: ${err.message}`,
          timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      setRobotStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  // เริ่มอัดเสียงพูด (Voice Recording)
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
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        await handleSendAudio(audioBlob, mimeType);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRobotStatus('listening');
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      alert('ไม่สามารถเข้าถึงไมโครโฟนได้: ' + (err.message || 'กรุณาอนุญาตการใช้งานไมโครโฟนในเบราว์เซอร์'));
      setRobotStatus('idle');
    }
  };

  // หยุดอัดเสียงพูด
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  // ส่งข้อมูลเสียงไปยัง API
  const handleSendAudio = async (blob: Blob, mimeType: string) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      const userMsgId = 'usr-voice-' + Date.now();
      const nowTime = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

      setMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          sender: 'user',
          text: '🎙️ ส่งเสียงพูด (กำลังถอดเสียงและค้นหาข้อมูล...)',
          timestamp: nowTime,
          isVoice: true
        }
      ]);

      setLoading(true);
      setRobotStatus('thinking');

      try {
        const res = await fetch('/api/robot/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64Audio,
            audioMimeType: mimeType,
            generateVoiceReply: true,
            voiceGender: botGender
          })
        });

        const data = await res.json();
        if (res.ok && data.result) {
          const resData: RAGPlaygroundResult = data.result;

          // ปรับปรุงข้อความของผู้ใช้ด้วยข้อความที่ถอดเสียงได้
          if (resData.transcribedQuestion) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === userMsgId
                  ? {
                      ...m,
                      text: `🎙️ "${resData.transcribedQuestion}"`
                    }
                  : m
              )
            );
          }

          setMessages((prev) => [
            ...prev,
            {
              id: 'ai-' + Date.now(),
              sender: 'ai',
              text: resData.answer,
              timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }),
              result: resData
            }
          ]);

          if (resData.sources && resData.sources.length > 0) {
            setActiveSources(resData.sources);
          }

          if (autoSpeak && resData.audioUrl) {
            playAudioReply(resData.audioUrl);
          } else {
            setRobotStatus('idle');
          }
        } else {
          const polite = botGender === 'female' ? 'ค่ะ' : 'ครับ';
          setMessages((prev) => [
            ...prev,
            {
              id: 'ai-err-' + Date.now(),
              sender: 'ai',
              text: `ขออภัย${polite} ไม่สามารถประมวลผลเสียงได้: ${data.error || 'กรุณาลองใหม่อีกครั้ง'}`,
              timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
            }
          ]);
          setRobotStatus('idle');
        }
      } catch (err: any) {
        const polite = botGender === 'female' ? 'ค่ะ' : 'ครับ';
        setMessages((prev) => [
          ...prev,
          {
            id: 'ai-err-' + Date.now(),
            sender: 'ai',
            text: `ขออภัย${polite} เกิดข้อผิดพลาด: ${err.message}`,
            timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setRobotStatus('idle');
      } finally {
        setLoading(false);
      }
    };
  };

  // รีเซ็ตการสนทนาเพื่อต้อนรับผู้ใช้งานคนใหม่
  const handleResetSession = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setRobotStatus('idle');
    setActiveSources([]);
    const polite = botGender === 'female' ? 'ค่ะ' : 'ครับ';
    const politeParticle = botGender === 'female' ? 'นะคะ' : 'ครับ';
    setMessages([
      {
        id: 'welcome-robot-' + Date.now(),
        sender: 'ai',
        text: `ยินดีต้อนรับสู่วิทยาลัยการอาชีพฝาง${polite}! 😊\nพร้อมให้บริการแล้ว แตะปุ่มไมค์เพื่อพูดคุย หรือแตะเลือกหัวข้อคำถามด้านบนได้เลย${politeParticle}`,
        timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // สลับโหมดเต็มหน้าจอ Kiosk
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Fullscreen request error:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch((err) => {
        console.error('Exit fullscreen error:', err);
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#e9efeb] text-[#1c2a25] flex flex-col justify-between font-sans selection:bg-[#9b1008] selection:text-white p-2 sm:p-4 md:p-6 transition-all">
      {/* Main Container Frame */}
      <div className="w-full max-w-[1440px] mx-auto bg-white rounded-2xl md:rounded-3xl border border-[#dfe7e1] shadow-2xl overflow-hidden flex flex-col">
        {/* TOP BAR */}
        <header className="h-[72px] border-b border-[#e6ebe7] px-4 sm:px-7 flex items-center justify-between bg-white flex-shrink-0">
          {/* Brand & Official Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white border border-[#d9bd70]/40 ring-2 ring-[#9b1008]/15 flex items-center justify-center p-1 shadow-sm flex-shrink-0 transition-transform hover:scale-105">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/img/logofve.png"
                alt="โลโก้วิทยาลัยการอาชีพฝาง"
                className="w-full h-full object-contain filter drop-shadow-xs"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heading font-extrabold text-base sm:text-lg text-[#1c2a25] tracking-tight">
                  PR4Fang AI
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#9b1008]/10 text-[#9b1008] border border-[#9b1008]/20">
                  Robot Reception
                </span>
              </div>
              <p className="text-[11px] text-[#718078] leading-tight">
                วิทยาลัยการอาชีพฝาง · หุ่นยนต์ผู้ช่วยประชาสัมพันธ์
              </p>
            </div>
          </div>

          {/* Controls & Status Indicator */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            {/* Live Status Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#edf7f0] text-[#247452] border border-[#d6ebd9] text-xs font-semibold shadow-xs">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#32a36b] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#32a36b]"></span>
              </span>
              <span className="hidden sm:inline">
                {robotStatus === 'listening'
                  ? 'กำลังรับฟังเสียง...'
                  : robotStatus === 'thinking'
                  ? 'กำลังประมวลผลคำตอบ...'
                  : robotStatus === 'speaking'
                  ? 'กำลังพูดตอบกลับ...'
                  : 'หุ่นยนต์พร้อมให้บริการ'}
              </span>
              <span className="sm:hidden">พร้อมใช้</span>
            </div>

            {/* Gender Switcher (Female / Male) */}
            <div className="flex items-center rounded-xl border border-[#e6ebe7] bg-[#fbfcfb] p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => handleToggleGender('female')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  botGender === 'female'
                    ? 'bg-[#9b1008] text-white shadow-2xs'
                    : 'text-[#718078] hover:text-[#1c2a25]'
                }`}
                title="เสียงผู้หญิง (คำลงท้าย: ค่ะ / นะคะ / เจ้า)"
              >
                <span>👧</span>
                <span className="hidden md:inline">หญิง (ค่ะ)</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleGender('male')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  botGender === 'male'
                    ? 'bg-[#9b1008] text-white shadow-2xs'
                    : 'text-[#718078] hover:text-[#1c2a25]'
                }`}
                title="เสียงผู้ชาย (คำลงท้าย: ครับ / นะครับ / เน้อครับ)"
              >
                <span>👦</span>
                <span className="hidden md:inline">ชาย (ครับ)</span>
              </button>
            </div>

            {/* Bluetooth Config Button */}
            <button
              type="button"
              onClick={() => setIsBtModalOpen(true)}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
                btDeviceName
                  ? 'bg-[#edf7f0] border-[#d6ebd9] text-[#247452]'
                  : 'bg-white border-[#e6ebe7] text-[#58655e] hover:bg-gray-50'
              }`}
              title="ตั้งค่าเชื่อมต่ออุปกรณ์บลูทูธ (ไมค์/ลำโพงไร้สาย/บอร์ดหุ่นยนต์)"
            >
              <Bluetooth className={`w-4 h-4 ${btDeviceName ? 'text-[#247452]' : 'text-[#9b1008]'}`} />
              <span className="hidden lg:inline">{btDeviceName ? `BT: ${btDeviceName}` : 'Config Bluetooth'}</span>
            </button>

            {/* Auto Voice Toggle */}
            <button
              type="button"
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs ${
                autoSpeak
                  ? 'bg-[#fff0ef] border-[#f0ddda] text-[#9b1008]'
                  : 'bg-white border-[#e6ebe7] text-[#718078] hover:bg-gray-50'
              }`}
              title={autoSpeak ? 'ปิดเสียงพูดอัตโนมัติ' : 'เปิดเสียงพูดอัตโนมัติ'}
            >
              {autoSpeak ? <Volume2 className="w-4 h-4 text-[#9b1008]" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden xl:inline">{autoSpeak ? 'เสียงพูด: เปิด' : 'เสียงพูด: ปิด'}</span>
            </button>

            {/* Reset / New Session */}
            <button
              type="button"
              onClick={handleResetSession}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-[#e6ebe7] bg-white hover:bg-gray-50 text-[#58655e] text-xs font-medium flex items-center gap-1.5 transition-all shadow-xs"
              title="เริ่มบทสนทนาใหม่สำหรับผู้ใช้งานคนถัดไป"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">เริ่มคุยใหม่</span>
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl border border-[#e6ebe7] bg-white hover:bg-gray-50 text-[#58655e] transition-all shadow-xs"
              title={isFullscreen ? 'ออกจากโหมดเต็มจอ' : 'แสดงเต็มหน้าจอ Kiosk'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* SCREEN GRID (Rail / Chat / Aside) */}
        <main className="grid grid-cols-1 lg:grid-cols-[280px_1fr] xl:grid-cols-[280px_1fr_320px] min-h-[640px] bg-gradient-to-r from-[#fbfcfb] via-[#f6f8f6] to-white relative">
          {/* LEFT RAIL: Robot Avatar & Persona */}
          <aside className="p-6 border-r border-[#e6ebe7] flex flex-col items-center justify-between bg-[#fbfcfb]/90 backdrop-blur-xs">
            <div className="flex flex-col items-center w-full">
              {/* Interactive Animated Robot Head */}
              <div
                className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 my-2 shadow-md ${
                  robotStatus === 'listening'
                    ? 'ring-4 ring-[#9b1008]/40 bg-gradient-to-br from-[#fff0ef] to-[#fee2e2] scale-105 animate-pulse'
                    : robotStatus === 'thinking'
                    ? 'ring-4 ring-[#c5a451]/50 bg-gradient-to-br from-[#fffbeb] to-[#fef3c7] scale-105'
                    : robotStatus === 'speaking'
                    ? 'ring-4 ring-[#247452]/40 bg-gradient-to-br from-[#ecfdf5] to-[#d1fae5] scale-102'
                    : 'bg-gradient-to-br from-[#fff4f2] to-[#f7f8f6] border border-[#f0ddda]'
                }`}
              >
                {/* Robot SVG with dynamic expressions */}
                <svg viewBox="0 0 100 100" className="w-20 h-20 transition-transform duration-300">
                  {/* Antenna */}
                  <path
                    d="M50 14v11"
                    stroke={robotStatus === 'listening' ? '#9b1008' : '#9b1008'}
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="50"
                    cy="11"
                    r={robotStatus === 'thinking' ? '6' : '5'}
                    fill={robotStatus === 'thinking' ? '#f59e0b' : '#c5a451'}
                    className={robotStatus === 'thinking' ? 'animate-ping' : ''}
                  />

                  {/* Body / Head Box */}
                  <rect
                    x="19"
                    y="26"
                    width="62"
                    height="51"
                    rx="18"
                    fill="white"
                    stroke="#a91b13"
                    strokeWidth="3.5"
                  />

                  {/* Ears */}
                  <path
                    d="M19 43h-7v16h7m62-16h7v16h-7"
                    stroke="#a91b13"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* Eyes */}
                  {robotStatus === 'listening' ? (
                    <>
                      <circle cx="39" cy="49" r="6" fill="#9b1008" />
                      <circle cx="41" cy="47" r="2" fill="white" />
                      <circle cx="61" cy="49" r="6" fill="#9b1008" />
                      <circle cx="63" cy="47" r="2" fill="white" />
                    </>
                  ) : robotStatus === 'thinking' ? (
                    <>
                      <circle cx="39" cy="49" r="4.5" fill="#c5a451" />
                      <circle cx="61" cy="49" r="4.5" fill="#c5a451" />
                    </>
                  ) : (
                    <>
                      <circle cx="39" cy="49" r="4.5" fill="#9b1008" />
                      <circle cx="61" cy="49" r="4.5" fill="#9b1008" />
                    </>
                  )}

                  {/* Mouth */}
                  {robotStatus === 'speaking' ? (
                    <path
                      d="M40 64c4 4 16 4 20 0"
                      stroke="#a91b13"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      className="animate-bounce"
                    />
                  ) : (
                    <path
                      d="M40 63c5 5 15 5 20 0"
                      stroke="#a91b13"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                  )}

                  {/* Neck & Shoulder */}
                  <path d="M37 78v8m26-8v8M33 87h34" stroke="#c5a451" strokeWidth="4" strokeLinecap="round" />
                </svg>

                {/* Status Dot on avatar corner */}
                <span
                  className={`absolute right-2 bottom-2 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                    robotStatus === 'listening'
                      ? 'bg-[#b7251b] animate-ping'
                      : robotStatus === 'thinking'
                      ? 'bg-[#d97706]'
                      : robotStatus === 'speaking'
                      ? 'bg-[#2563eb]'
                      : 'bg-[#39a66d]'
                  }`}
                />
              </div>

              {/* Persona Tag */}
              <div className="flex items-center gap-1.5 mt-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#9b1008]">
                  ผู้ช่วยประชาสัมพันธ์
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#fff0ef] text-[#9b1008] border border-[#f0ddda]">
                  {botGender === 'female' ? '👧 เสียงหญิง' : '👦 เสียงชาย'}
                </span>
              </div>
              <h2 className="font-heading font-extrabold text-xl text-[#1c2a25] tracking-tight">
                สวัสดีเจ้า 👋
              </h2>
              <p className="text-center text-xs text-[#718078] leading-relaxed mt-2 mb-4">
                ถามข้อมูลวิทยาลัยได้เลย<br />
                จะพิมพ์หรือแตะไมค์พูดก็ได้{botGender === 'female' ? 'ค่ะ' : 'ครับ'}
              </p>

              {/* Voice Capabilities Card */}
              <div className="w-full bg-white border border-[#e6ebe7] rounded-2xl p-3.5 shadow-xs text-xs text-[#58655e] space-y-1.5">
                <div className="flex items-center gap-2 text-[#9b1008] font-semibold text-xs">
                  <Mic className="w-4 h-4" />
                  <span>รองรับเสียงพูด 2 ภาษา</span>
                </div>
                <p className="text-[11px] text-[#718078] leading-relaxed">
                  ฟังภาษาไทยและภาษาถิ่นเหนือ (คำเมือง) แล้วตอบกลับด้วยเสียงพูดสุภาพ ({botGender === 'female' ? 'คำลงท้าย: ค่ะ/เจ้า' : 'คำลงท้าย: ครับ/เน้อครับ'})
                </p>
              </div>

              {/* Model & Accuracy Badge */}
              <div className="w-full mt-3 p-3 rounded-2xl bg-[#edf7f0]/60 border border-[#dcebe0] text-xs space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#247452] font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>RAG Knowledge</span>
                  </span>
                  <span className="text-[#32a36b] font-bold">
                    {statusInfo.publishedKnowledgeCount || '10+'} เอกสาร
                  </span>
                </div>
                <p className="text-[10px] text-[#718078]">
                  ค้นคืนจากคลังความรู้ที่วิทยาลัยอนุมัติและเผยแพร่
                </p>
              </div>
            </div>

            {/* Security / Privacy Notice */}
            <div className="w-full pt-4 border-t border-[#e6ebe7] text-[11px] text-[#909a94] flex items-center justify-center gap-2 mt-4">
              <span className="text-[#39a66d] text-base leading-none">●</span>
              <span>พร้อมรับฟัง · ไม่บันทึกเสียงดิบ</span>
            </div>
          </aside>

          {/* CENTER: Main Interactive Chat Window */}
          <section className="flex flex-col p-4 sm:p-7 min-w-0 flex-1">
            {/* Chat Head */}
            <div className="flex items-start justify-between pb-3 border-b border-[#e6ebe7]/60">
              <div>
                <h1 className="font-heading font-extrabold text-lg sm:text-xl text-[#1c2a25]">
                  คุยกับผู้ช่วยวิทยาลัย
                </h1>
                <p className="text-xs text-[#718078] mt-0.5">
                  สอบถามข้อมูลการเรียน แผนกวิชา สมัครเรียน ระเบียบ และบริการต่าง ๆ
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAside(!showAside)}
                  className="xl:hidden px-3 py-1.5 rounded-xl border border-[#e6ebe7] bg-white text-xs text-[#58655e] flex items-center gap-1"
                >
                  <Info className="w-3.5 h-3.5 text-[#9b1008]" />
                  <span>{showAside ? 'ซ่อนที่มา' : 'ดูที่มา'}</span>
                </button>
              </div>
            </div>

            {/* Quick Suggestions (Touch Friendly) */}
            <div className="my-3">
              <span className="text-[11px] font-semibold text-[#65736b] block mb-2">
                แตะเลือกหัวข้อที่สนใจ:
              </span>
              <div className="flex flex-wrap gap-2">
                {QUICK_SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(item.question)}
                    disabled={loading || isRecording}
                    className="px-3.5 py-2 rounded-full border border-[#e4eae5] bg-white hover:bg-[#fff0ef] hover:border-[#cb8c85] hover:text-[#9b1008] text-xs font-medium text-[#57645d] transition-all shadow-2xs active:scale-95 disabled:opacity-50"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Messages History */}
            <div className="flex-1 overflow-y-auto space-y-4 py-3 pr-1 sm:pr-2 min-h-[300px] max-h-[50vh] scroll-smooth">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-fadeIn`}
                >
                  <div
                    className={`flex items-start gap-2.5 max-w-[94%] sm:max-w-[85%] ${
                      msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {/* Mini Avatar */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-xs mt-0.5 ${
                        msg.sender === 'user'
                          ? 'bg-[#9b1008] text-white'
                          : 'bg-[#fff0ed] text-[#9b1008] border border-[#f3dedb]'
                      }`}
                    >
                      {msg.sender === 'user' ? 'คุณ' : 'AI'}
                    </div>

                    {/* Bubble Content */}
                    <div className="space-y-2">
                      <div
                        className={`p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                          msg.sender === 'user'
                            ? 'bg-[#9b1008] text-white rounded-2xl rounded-tr-xs'
                            : 'bg-white text-[#1c2a25] border border-[#e9eeea] rounded-2xl rounded-tl-xs'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>

                      {/* AI Result Enhancements (Audio / Image / Document / Source) */}
                      {msg.result && (
                        <div className="space-y-2 max-w-full">
                          {/* Audio Reply Player */}
                          {msg.result.audioUrl && (
                            <div className="p-3 rounded-2xl bg-white border border-[#eed8d4] shadow-xs flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => playAudioReply(msg.result!.audioUrl!)}
                                  className="w-8 h-8 rounded-full bg-[#fff0ef] hover:bg-[#9b1008] text-[#9b1008] hover:text-white flex items-center justify-center transition-all shadow-xs"
                                  title="กดฟังเสียงอีกครั้ง"
                                >
                                  <Volume2 className="w-4 h-4" />
                                </button>
                                <div>
                                  <div className="text-[11px] font-semibold text-[#9b1008] flex items-center gap-1.5">
                                    <span>เสียงตอบกลับของหุ่นยนต์</span>
                                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-red-100 text-red-800">
                                      {botGender === 'female' ? 'หญิง' : 'ชาย'}
                                    </span>
                                    {msg.result.detectedDialect === 'kham_mueang' && (
                                      <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-amber-100 text-amber-800">
                                        คำเมือง
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-[#718078]">แตะเพื่อฟังซ้ำ</p>
                                </div>
                              </div>
                              <audio
                                controls
                                src={msg.result.audioUrl}
                                className="h-7 w-36 sm:w-48 accent-[#9b1008]"
                              />
                            </div>
                          )}

                          {/* Teacher Carousel / Gallery for Robot Interface */}
                          {msg.result.matchedTeachers && msg.result.matchedTeachers.length > 1 ? (
                            <div className="p-3.5 rounded-2xl bg-white border border-[#e9eeea] shadow-xs max-w-xl space-y-2.5 transition-all">
                              <div className="flex items-center justify-between text-xs font-semibold text-[#1c2a25]">
                                <span className="flex items-center gap-1.5 text-[#9b1008] text-xs font-bold">
                                  รายชื่อคณาจารย์และบุคลากร ({msg.result.matchedTeachers.length} ท่าน)
                                </span>
                                <span className="text-[10px] text-[#718078]">
                                  แตะรูปเพื่อดูภาพขนาดเต็ม ➔
                                </span>
                              </div>

                              <div className="flex gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar scroll-smooth snap-x">
                                {msg.result.matchedTeachers.map((teacher, tIdx) => {
                                  const proxiedUrl = teacher.imageUrl.includes('googleusercontent.com') || teacher.imageUrl.includes('drive.google.com')
                                    ? `/api/media-proxy?url=${encodeURIComponent(teacher.imageUrl)}`
                                    : teacher.imageUrl;
                                  return (
                                    <div
                                      key={teacher.file_id || tIdx}
                                      className="flex-shrink-0 w-36 sm:w-40 rounded-2xl bg-[#fbfcfb] border border-[#e6ebe7] p-2.5 flex flex-col items-center text-center group hover:border-[#9b1008]/40 hover:shadow-md transition-all cursor-pointer snap-start"
                                      onClick={() => window.open(proxiedUrl, '_blank')}
                                      title="แตะเพื่อเปิดดูภาพขนาดเต็ม"
                                    >
                                      <div className="w-28 sm:w-32 h-32 sm:h-36 rounded-xl overflow-hidden bg-gray-100 mb-2 relative shadow-xs">
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
                                      <p className="text-xs font-bold text-[#1c2a25] line-clamp-1 w-full" title={teacher.name}>
                                        {teacher.name}
                                      </p>
                                      <p className="text-[10px] text-[#718078] line-clamp-1 w-full mt-0.5" title={teacher.department}>
                                        {teacher.department.replace(/^รายชื่อครูและบุคลากรสาขาวิชา/i, '').replace(/^สาขาวิชา/i, '').trim()}
                                      </p>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : msg.result.imageUrl ? (
                            <div className="p-2.5 rounded-2xl bg-white border border-[#e9eeea] shadow-xs max-w-sm space-y-1.5 transition-all">
                              <div className="flex items-center justify-between text-xs font-semibold text-[#1c2a25]">
                                <span className="flex items-center gap-1.5 text-[#9b1008] text-[11px] font-bold">
                                  🖼️ {msg.result.isWebAttachment ? 'ภาพจากฐานความรู้' : 'ภาพประกอบ'}
                                </span>
                                {msg.result.imageCaption && (
                                  <span className="text-[10px] text-[#718078] truncate max-w-[150px]">
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
                                className="w-full max-h-56 object-contain rounded-xl bg-gray-50 border border-gray-100 cursor-pointer hover:opacity-95 transition-opacity"
                                onClick={() => {
                                  const fullUrl = msg.result?.imageUrl?.includes('googleusercontent.com')
                                    ? `/api/media-proxy?url=${encodeURIComponent(msg.result.imageUrl)}`
                                    : msg.result?.imageUrl;
                                  if (fullUrl) window.open(fullUrl, '_blank');
                                }}
                                title="แตะเพื่อเปิดดูภาพขนาดเต็ม"
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

                          {/* Document Attachment Preview */}
                          {msg.result.documentAttachment &&
                            msg.result.documentAttachment.file_url &&
                            !msg.result.documentAttachment.file_url.includes('/folders/') && (
                              <div className="p-2.5 rounded-2xl bg-white border border-[#e9eeea] shadow-xs max-w-sm">
                                <a
                                  href={msg.result.documentAttachment.file_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center justify-between p-2 rounded-xl bg-[#edf7f0] hover:bg-[#dcebe0] text-xs text-[#247452] font-semibold transition-all group"
                                >
                                  <span className="flex items-center gap-1.5 truncate">
                                    <FileText className="w-4 h-4 flex-shrink-0" />
                                    <span className="truncate">
                                      {msg.result.documentAttachment.file_name}
                                    </span>
                                  </span>
                                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0 ml-1 group-hover:scale-110 transition-transform" />
                                </a>
                              </div>
                            )}

                          {/* Fallback Notice */}
                          {msg.result.is_fallback && (
                            <div className="p-2.5 rounded-xl bg-[#fff9ec] border border-[#f0e4c7] text-[#74643e] text-[11px] flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-[#d97706] flex-shrink-0" />
                              <span>
                                ยืนยันข้อมูลจากคลังความรู้ไม่พบ ➔ แนะนำติดต่อสอบถามที่เคาน์เตอร์ประชาสัมพันธ์โดยตรง{botGender === 'female' ? 'ค่ะ' : 'ครับ'}
                              </span>
                            </div>
                          )}

                          {/* Verification Chip */}
                          <div className="flex items-center gap-2 text-[10px] text-[#718078] px-1">
                            <span className="inline-flex items-center gap-1 text-[#247452] font-semibold">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>ตรวจทานแหล่งความรู้แล้ว</span>
                            </span>
                            <span>•</span>
                            <span>ความมั่นใจ {(msg.result.confidence_score * 100).toFixed(0)}%</span>
                            <span>•</span>
                            <span>{msg.result.response_time_ms} ms</span>
                          </div>
                        </div>
                      )}

                      {/* Timestamp */}
                      <div
                        className={`text-[10px] text-[#99a39d] px-1 ${
                          msg.sender === 'user' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {msg.timestamp}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading Indicator */}
              {loading && (
                <div className="flex items-start gap-2.5 animate-fadeIn">
                  <div className="w-8 h-8 rounded-full bg-[#fff0ed] text-[#9b1008] border border-[#f3dedb] flex items-center justify-center text-xs font-bold">
                    AI
                  </div>
                  <div className="p-3.5 rounded-2xl rounded-tl-xs bg-white border border-[#e9eeea] text-xs text-[#58655e] flex items-center gap-2 shadow-xs">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#9b1008] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#9b1008]"></span>
                    </span>
                    <span>หุ่นยนต์กำลังค้นหาองค์ความรู้และสังเคราะห์คำตอบ...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* COMPOSE BAR (Touch & Voice Input) */}
            <div className="pt-3 border-t border-[#e6ebe7] mt-auto">
              {isRecording ? (
                // Recording State Bar
                <div className="flex items-center justify-between gap-3 p-3 bg-[#fff0ef] border-2 border-[#9b1008]/30 rounded-2xl animate-pulse shadow-sm">
                  <div className="flex items-center gap-3 text-[#9b1008] font-bold text-xs sm:text-sm">
                    <span className="w-3.5 h-3.5 rounded-full bg-[#9b1008] animate-ping" />
                    <span>
                      กำลังฟังเสียงพูดของคุณ... (0:{recordingSeconds < 10 ? '0' : ''}
                      {recordingSeconds})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={stopRecording}
                    className="h-10 px-5 rounded-xl bg-[#9b1008] text-white text-xs sm:text-sm font-semibold flex items-center gap-2 hover:bg-[#790b04] transition-all shadow-sm active:scale-95"
                  >
                    <span>แตะเพื่อส่งเสียง</span>
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                // Normal Input Form
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2.5"
                >
                  {/* Big Touch Mic Button */}
                  <button
                    type="button"
                    onClick={startRecording}
                    disabled={loading}
                    className="w-12 h-12 rounded-2xl bg-[#fff0ef] hover:bg-[#fee2e2] text-[#9b1008] border border-[#f0ddda] flex items-center justify-center transition-all flex-shrink-0 shadow-sm active:scale-95 disabled:opacity-40"
                    title="แตะเพื่อพูดภาษาไทยหรือคำเมือง"
                  >
                    <Mic className="w-5 h-5" />
                  </button>

                  {/* Input Box */}
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={`แตะเพื่อพิมพ์คำถาม หรือกดไมโครโฟนเพื่อพูด...`}
                    disabled={loading}
                    className="flex-1 h-12 px-4 rounded-2xl border border-[#e2e9e4] bg-white text-sm text-[#1c2a25] placeholder:text-[#9aa49e] focus:outline-none focus:border-[#9b1008] focus:ring-1 focus:ring-[#9b1008] transition-all disabled:opacity-50"
                  />

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="h-12 px-5 rounded-2xl bg-[#9b1008] hover:bg-[#790b04] text-white font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm active:scale-95 disabled:opacity-40 flex-shrink-0"
                  >
                    <span>ส่งคำถาม</span>
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </section>

          {/* RIGHT ASIDE: References & Transparency Guidelines */}
          {showAside && (
            <aside className="border-t lg:border-t-0 lg:border-l border-[#e6ebe7] p-6 bg-white flex flex-col justify-between">
              <div>
                <h3 className="font-heading font-bold text-sm text-[#1c2a25] mb-1">
                  ข้อมูลที่ใช้อ้างอิง
                </h3>
                <p className="text-[11px] text-[#87928c] leading-relaxed mb-4">
                  แสดงที่มาของคำตอบเมื่อพบเอกสารในคลังความรู้ที่เผยแพร่และอนุญาตให้ AI ใช้งาน
                </p>

                {/* Sources List */}
                <div className="space-y-2.5 max-h-[300px] overflow-y-auto">
                  {activeSources && activeSources.length > 0 ? (
                    activeSources.map((src, i) => (
                      <div
                        key={src.knowledge_id || i}
                        className="p-3 rounded-xl bg-[#f8faf8] border border-[#e7ece8] text-xs space-y-1 hover:border-[#cb8c85] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-[#edf4ef] text-[#247452] flex items-center justify-center text-[10px] font-bold">
                            #{src.rank || i + 1}
                          </span>
                          <span className="font-semibold text-[#1c2a25] truncate">
                            {src.title}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[#87928c] pt-1">
                          <span>{src.department_name || 'วิทยาลัยการอาชีพฝาง'}</span>
                          <span className="text-[#247452] font-semibold">
                            ตรงประเด็น {(src.relevance_score * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed border-[#e6ebe7] text-center text-xs text-[#87928c] space-y-1">
                      <FileText className="w-6 h-6 mx-auto text-[#cbd5e1]" />
                      <p className="text-[11px]">เอกสารที่เกี่ยวข้องจะแสดงตรงนี้เมื่อท่านถามคำถาม</p>
                    </div>
                  )}
                </div>

                <div className="my-5 h-[1px] bg-[#e6ebe7]" />

                {/* Fallback policy card */}
                <div className="p-3.5 rounded-xl bg-[#fff9ec] border border-[#f0e4c7] text-xs text-[#74643e] space-y-1.5">
                  <div className="font-bold text-[#655128] flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-[#d97706]" />
                    <span>เมื่อระบบยังยืนยันคำตอบไม่ได้</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    AI จะบอกตามตรงและแนะนำช่องทางติดต่อเจ้าหน้าที่เคาน์เตอร์จริง แทนการเดาข้อมูลที่ไม่เป็นทางการ
                  </p>
                </div>
              </div>

              {/* Architecture Drawer Trigger */}
              <div className="pt-4 border-t border-[#e6ebe7] mt-4">
                <button
                  type="button"
                  onClick={() => setShowArchDiagram(!showArchDiagram)}
                  className="w-full py-2 px-3 rounded-xl border border-[#e6ebe7] hover:bg-gray-50 text-xs font-semibold text-[#58655e] flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#9b1008]" />
                    <span>สถาปัตยกรรมเชื่อมต่อหุ่นยนต์</span>
                  </span>
                  {showArchDiagram ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </div>
            </aside>
          )}
        </main>

        {/* FOOTER BAR */}
        <footer className="h-11 border-t border-[#e6ebe7] px-6 flex items-center justify-between text-[11px] text-[#89948e] bg-white flex-shrink-0">
          <span>วิทยาลัยการอาชีพฝาง · PR4Fang AI (Robot Reception Mode)</span>
          <span className="hidden sm:inline">ผู้ช่วยประชาสัมพันธ์ · ใช้ข้อมูลความรู้ที่วิทยาลัยอนุมัติ</span>
        </footer>
      </div>

      {/* SYSTEM ARCHITECTURE OVERVIEW (Collapsible Drawer / Section) */}
      {showArchDiagram && (
        <section className="w-full max-w-[1440px] mx-auto mt-4 bg-white border border-[#dfe7e1] rounded-2xl p-5 shadow-lg animate-fadeIn">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#e6ebe7]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#9b1008]" />
              <b className="font-heading text-sm text-[#1c2a25]">
                แนวทางเชื่อมต่อกับสถาปัตยกรรมระบบปัจจุบัน (Robot Integration Flow)
              </b>
            </div>
            <button
              type="button"
              onClick={() => setShowArchDiagram(false)}
              className="text-xs text-[#718078] hover:text-[#9b1008]"
            >
              ปิดหน้าต่าง ✕
            </button>
          </div>

          {/* 7-Step Pipeline Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {/* Step 1 */}
            <div className="p-3 rounded-xl bg-[#fff6f4] border border-[#eed8d4] text-center flex flex-col justify-center">
              <span className="text-[10px] font-bold text-[#9b1008] uppercase">① Robot UI</span>
              <p className="text-[10px] text-[#718078] mt-1 leading-tight">
                ไมค์ / ข้อความ<br />จอและลำโพง
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-3 rounded-xl bg-[#fbfcfb] border border-[#e5ebe6] text-center flex flex-col justify-center">
              <span className="text-[10px] font-bold text-[#7a5140] uppercase">② Robot API</span>
              <p className="text-[10px] text-[#718078] mt-1 leading-tight">
                Endpoint แยก<br />ไม่ต้อง Login
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-3 rounded-xl bg-[#fff6f4] border border-[#eed8d4] text-center flex flex-col justify-center">
              <span className="text-[10px] font-bold text-[#9b1008] uppercase">③ AI Engine</span>
              <p className="text-[10px] text-[#718078] mt-1 leading-tight">
                System Prompt<br />และค่า RAG หลัก
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-3 rounded-xl bg-[#f0f7f2] border border-[#dcebe0] text-center flex flex-col justify-center">
              <span className="text-[10px] font-bold text-[#277453] uppercase">④ Knowledge</span>
              <p className="text-[10px] text-[#718078] mt-1 leading-tight">
                คลังความรู้เผยแพร่<br />และเปิดใช้ AI
              </p>
            </div>

            {/* Step 5 */}
            <div className="p-3 rounded-xl bg-[#fbfcfb] border border-[#e5ebe6] text-center flex flex-col justify-center">
              <span className="text-[10px] font-bold text-[#715696] uppercase">⑤ LLM Model</span>
              <p className="text-[10px] text-[#718078] mt-1 leading-tight">
                Gemini 3.1 Flash<br />สังเคราะห์คำตอบ
              </p>
            </div>

            {/* Step 6 */}
            <div className="p-3 rounded-xl bg-[#fff9eb] border border-[#f0e6cc] text-center flex flex-col justify-center">
              <span className="text-[10px] font-bold text-[#b45309] uppercase">⑥ Confidence</span>
              <p className="text-[10px] text-[#718078] mt-1 leading-tight">
                เกณฑ์ ≥ 0.70<br />ต่ำกว่า ➔ Fallback
              </p>
            </div>

            {/* Step 7 */}
            <div className="p-3 rounded-xl bg-[#f0f9ff] border border-[#bae6fd] text-center flex flex-col justify-center">
              <span className="text-[10px] font-bold text-[#0284c7] uppercase">⑦ Robot Output</span>
              <p className="text-[10px] text-[#718078] mt-1 leading-tight">
                ข้อความบนจอ<br />TTS ออกลำโพง
              </p>
            </div>
          </div>

          <p className="text-[11px] text-[#78857d] leading-relaxed mt-3 pt-3 border-t border-[#e6ebe7]">
            <strong>ระบบ RAG Pipeline แบบรวมศูนย์:</strong> หุ่นยนต์จะดึงข้อมูลสดจากฐานข้อมูลองค์ความรู้ของวิทยาลัยการอาชีพฝางโดยตรง รองรับภาษาถิ่นเหนือ (คำเมือง) และมีระบบ Fallback อัตโนมัติเมื่อเอกสารยังไม่เพียงพอ
          </p>
        </section>
      )}

      {/* BLUETOOTH & AUDIO CONFIG MODAL */}
      <BluetoothConfigModal
        isOpen={isBtModalOpen}
        onClose={() => {
          setIsBtModalOpen(false);
          setBtDeviceName(localStorage.getItem('pr4fang_robot_bt_name'));
        }}
        voiceGender={botGender}
      />
    </div>
  );
}
