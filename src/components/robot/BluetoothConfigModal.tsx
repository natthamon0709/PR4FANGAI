'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Bluetooth,
  BluetoothConnected,
  BluetoothSearching,
  Mic,
  Volume2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  Radio,
  Sliders,
  Play,
  Sparkles,
  Smartphone
} from 'lucide-react';

interface BluetoothConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  voiceGender: 'female' | 'male';
}

interface AudioDeviceItem {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
}

export default function BluetoothConfigModal({
  isOpen,
  onClose,
  voiceGender
}: BluetoothConfigModalProps) {
  const [activeTab, setActiveTab] = useState<'audio' | 'ble'>('audio');
  const [audioInputs, setAudioInputs] = useState<AudioDeviceItem[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<AudioDeviceItem[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>('');
  const [selectedSpeakerId, setSelectedSpeakerId] = useState<string>('');
  const [isTestingSpeaker, setIsTestingSpeaker] = useState(false);
  const [isMicTesting, setIsMicTesting] = useState(false);
  const [micVolume, setMicVolume] = useState(0);

  // BLE State
  const [isBleSupported, setIsBleSupported] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [bleDeviceName, setBleDeviceName] = useState<string | null>(null);
  const [bleConnected, setBleConnected] = useState(false);
  const [bleStatusMsg, setBleStatusMsg] = useState<string>('');

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // ตรวจสอบ Web Bluetooth Support & ดึงรายการอุปกรณ์เสียง
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsBleSupported(typeof navigator !== 'undefined' && 'bluetooth' in (navigator as any));

      // โหลดการตั้งค่าอุปกรณ์ที่เคยบันทึกไว้
      const savedMic = localStorage.getItem('pr4fang_robot_mic_id');
      const savedSpeaker = localStorage.getItem('pr4fang_robot_speaker_id');
      const savedBtDevice = localStorage.getItem('pr4fang_robot_bt_name');

      if (savedMic) setSelectedMicId(savedMic);
      if (savedSpeaker) setSelectedSpeakerId(savedSpeaker);
      if (savedBtDevice) {
        setBleDeviceName(savedBtDevice);
        setBleConnected(true);
      }
    }
  }, []);

  // ดึงรายการอุปกรณ์เสียงเมื่อเปิด modal
  const refreshAudioDevices = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return;
      }

      // ขอสิทธิ์ก่อนเพื่อให้เห็นชื่ออุปกรณ์
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
      } catch (err) {
        // user denied or no mic, still proceed to enumerate
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const inputs: AudioDeviceItem[] = [];
      const outputs: AudioDeviceItem[] = [];

      devices.forEach((d, idx) => {
        if (d.kind === 'audioinput') {
          inputs.push({
            deviceId: d.deviceId,
            label: d.label || `ไมโครโฟน ${idx + 1}`,
            kind: 'audioinput'
          });
        } else if (d.kind === 'audiooutput') {
          outputs.push({
            deviceId: d.deviceId,
            label: d.label || `ลำโพง ${idx + 1}`,
            kind: 'audiooutput'
          });
        }
      });

      setAudioInputs(inputs);
      setAudioOutputs(outputs);

      if (!selectedMicId && inputs.length > 0) {
        setSelectedMicId(inputs[0].deviceId);
      }
      if (!selectedSpeakerId && outputs.length > 0) {
        setSelectedSpeakerId(outputs[0].deviceId);
      }
    } catch (err) {
      console.error('Error enumerating devices:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshAudioDevices();
    } else {
      stopMicTest();
    }
  }, [isOpen]);

  // บันทึกการเลือกไมค์
  const handleSelectMic = (id: string) => {
    setSelectedMicId(id);
    localStorage.setItem('pr4fang_robot_mic_id', id);
  };

  // บันทึกการเลือกลำโพง
  const handleSelectSpeaker = (id: string) => {
    setSelectedSpeakerId(id);
    localStorage.setItem('pr4fang_robot_speaker_id', id);
  };

  // ทดสอบลำโพง
  const handleTestSpeaker = () => {
    setIsTestingSpeaker(true);
    const polite = voiceGender === 'female' ? 'ค่ะ' : 'ครับ';
    const textToSpeak = `ทดสอบระบบเสียงลำโพงหุ่นยนต์วิทยาลัยการอาชีพฝาง${polite} เสียงทำงานได้ปกติ${polite}`;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = 'th-TH';
      utterance.rate = 1.0;

      utterance.onend = () => setIsTestingSpeaker(false);
      utterance.onerror = () => setIsTestingSpeaker(false);

      window.speechSynthesis.speak(utterance);
    } else {
      // fallback audio beep
      const AudioCtxClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        const audioCtx = new AudioCtxClass();
        const osc = audioCtx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.6);
      }
      setTimeout(() => setIsTestingSpeaker(false), 600);
    }
  };

  // ทดสอบไมโครโฟน
  const startMicTest = async () => {
    try {
      const constraints: MediaStreamConstraints = {
        audio: selectedMicId ? { deviceId: { exact: selectedMicId } } : true
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      micStreamRef.current = stream;

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      setIsMicTesting(true);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        setMicVolume(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (err: any) {
      alert('ไม่สามารถทดสอบไมโครโฟนได้: ' + err.message);
    }
  };

  const stopMicTest = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsMicTesting(false);
    setMicVolume(0);
  };

  // สแกนจับคู่อุปกรณ์ Web Bluetooth
  const handleScanBluetooth = async () => {
    const navBt = typeof navigator !== 'undefined' ? (navigator as any).bluetooth : null;
    if (!navBt) {
      alert('เบราว์เซอร์นี้ไม่รองรับ Web Bluetooth API แนะนำให้ใช้ Google Chrome หรือ Microsoft Edge ครับ');
      return;
    }

    setIsScanning(true);
    setBleStatusMsg('กำลังค้นหาอุปกรณ์บลูทูธใกล้เคียง...');

    try {
      const device = await navBt.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['generic_access', 'battery_service', 0x180f, 0x1800]
      });

      if (device) {
        setBleDeviceName(device.name || 'อุปกรณ์บลูทูธไม่ระบุชื่อ');
        setBleConnected(true);
        setBleStatusMsg(`จับคู่กับ ${device.name || 'อุปกรณ์'} เรียบร้อยแล้ว`);
        localStorage.setItem('pr4fang_robot_bt_name', device.name || 'อุปกรณ์บลูทูธ');
      }
    } catch (err: any) {
      console.log('Bluetooth scan cancelled or error:', err);
      if (err.name !== 'NotFoundError') {
        setBleStatusMsg(`การเชื่อมต่อขัดข้อง: ${err.message}`);
      } else {
        setBleStatusMsg('ยกเลิกการค้นหาอุปกรณ์');
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleDisconnectBle = () => {
    setBleDeviceName(null);
    setBleConnected(false);
    setBleStatusMsg('ตัดการเชื่อมต่ออุปกรณ์บลูทูธแล้ว');
    localStorage.removeItem('pr4fang_robot_bt_name');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-[#dfe7e1] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#e6ebe7] flex items-center justify-between bg-gradient-to-r from-[#fffbfb] to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#fff0ef] border border-[#f0ddda] text-[#9b1008] flex items-center justify-center shadow-xs">
              <Bluetooth className="w-5 h-5 text-[#9b1008]" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base text-[#1c2a25]">
                ตั้งค่าการเชื่อมต่อบลูทูธ (Bluetooth Config)
              </h3>
              <p className="text-[11px] text-[#718078]">
                เชื่อมต่อไมโครโฟน ลำโพงไร้สาย และอุปกรณ์เสริมสำหรับหุ่นยนต์
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-100 text-[#718078] hover:text-[#1c2a25] flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#e6ebe7] px-6 bg-[#fbfcfb]">
          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'audio'
                ? 'border-[#9b1008] text-[#9b1008]'
                : 'border-transparent text-[#718078] hover:text-[#1c2a25]'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>อุปกรณ์เสียง (ไมค์ & ลำโพง)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ble')}
            className={`py-3 px-4 font-semibold text-xs border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'ble'
                ? 'border-[#9b1008] text-[#9b1008]'
                : 'border-transparent text-[#718078] hover:text-[#1c2a25]'
            }`}
          >
            <Bluetooth className="w-4 h-4" />
            <span>จับคู่ Web Bluetooth (BLE)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'audio' ? (
            // AUDIO DEVICES TAB
            <div className="space-y-5">
              {/* Microphone Source */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[#1c2a25] flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-[#9b1008]" />
                    <span>เลือกไมโครโฟนอินพุต (Microphone)</span>
                  </label>
                  <button
                    type="button"
                    onClick={refreshAudioDevices}
                    className="text-[11px] text-[#9b1008] hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>ค้นหาอุปกรณ์ใหม่</span>
                  </button>
                </div>

                <select
                  value={selectedMicId}
                  onChange={(e) => handleSelectMic(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-[#dfe7e1] bg-white text-xs text-[#1c2a25] focus:outline-none focus:border-[#9b1008] focus:ring-1 focus:ring-[#9b1008] shadow-2xs"
                >
                  {audioInputs.length > 0 ? (
                    audioInputs.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label}
                      </option>
                    ))
                  ) : (
                    <option value="">ไม่พบไมโครโฟนที่เชื่อมต่อ</option>
                  )}
                </select>

                {/* Mic Volume Level Tester */}
                <div className="p-3 rounded-xl bg-[#f8faf8] border border-[#e7ece8] space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#718078] font-medium">ระดับเสียงไมค์สด (Mic Input Level):</span>
                    {isMicTesting ? (
                      <button
                        type="button"
                        onClick={stopMicTest}
                        className="text-[#9b1008] font-bold text-[10px] hover:underline"
                      >
                        หยุดทดสอบไมค์
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={startMicTest}
                        className="text-[#247452] font-bold text-[10px] hover:underline"
                      >
                        เริ่มทดสอบเสียงไมค์
                      </button>
                    )}
                  </div>

                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden flex items-center">
                    <div
                      className={`h-full transition-all duration-75 ${
                        micVolume > 70
                          ? 'bg-[#9b1008]'
                          : micVolume > 30
                          ? 'bg-[#247452]'
                          : 'bg-[#32a36b]'
                      }`}
                      style={{ width: `${micVolume}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Speaker Output */}
              <div className="space-y-2 pt-2 border-t border-[#e6ebe7]">
                <label className="text-xs font-bold text-[#1c2a25] flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-[#9b1008]" />
                  <span>เลือกลำโพงเอาต์พุต (Speaker / Audio Output)</span>
                </label>

                <select
                  value={selectedSpeakerId}
                  onChange={(e) => handleSelectSpeaker(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-[#dfe7e1] bg-white text-xs text-[#1c2a25] focus:outline-none focus:border-[#9b1008] focus:ring-1 focus:ring-[#9b1008] shadow-2xs"
                >
                  {audioOutputs.length > 0 ? (
                    audioOutputs.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label}
                      </option>
                    ))
                  ) : (
                    <option value="">ลำโพงเริ่มต้นของระบบ (Default Speaker)</option>
                  )}
                </select>

                {/* Speaker Test Button */}
                <button
                  type="button"
                  onClick={handleTestSpeaker}
                  disabled={isTestingSpeaker}
                  className="w-full h-10 px-4 rounded-xl bg-[#fff0ef] hover:bg-[#fee2e2] text-[#9b1008] border border-[#f0ddda] font-semibold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-2xs"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>
                    {isTestingSpeaker ? 'กำลังทดสอบเสียงลำโพง...' : 'ทดสอบส่งเสียงพูดออกลำโพงหุ่นยนต์'}
                  </span>
                </button>
              </div>

              {/* Guidance Box */}
              <div className="p-3.5 rounded-2xl bg-[#edf7f0] border border-[#d6ebd9] text-[11px] text-[#247452] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>คำแนะนำการต่อลำโพง/ไมค์กับหุ่นยนต์:</span>
                </div>
                <p className="leading-relaxed text-[11px] text-[#3e6853]">
                  หากใช้อุปกรณ์บลูทูธ (Bluetooth Speaker/Mic) ให้ทำการจับคู่กับระบบปฏิบัติการคอมพิวเตอร์หรือแท็บเล็ตก่อน รายชื่อจะปรากฏในเมนูนี้อัตโนมัติ
                </p>
              </div>
            </div>
          ) : (
            // WEB BLUETOOTH (BLE) TAB
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#fbfcfb] border border-[#e5ebe6] text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-[#fff0ef] text-[#9b1008] mx-auto flex items-center justify-center shadow-xs">
                  {bleConnected ? (
                    <BluetoothConnected className="w-7 h-7 text-[#247452]" />
                  ) : isScanning ? (
                    <BluetoothSearching className="w-7 h-7 text-[#9b1008] animate-pulse" />
                  ) : (
                    <Bluetooth className="w-7 h-7 text-[#9b1008]" />
                  )}
                </div>

                <div>
                  <h4 className="font-heading font-bold text-sm text-[#1c2a25]">
                    {bleConnected
                      ? `เชื่อมต่อกับ ${bleDeviceName}`
                      : 'ยังไม่ได้เชื่อมต่ออุปกรณ์ Web Bluetooth'}
                  </h4>
                  <p className="text-[11px] text-[#718078] mt-0.5">
                    สำหรับเชื่อมต่อบอร์ดหุ่นยนต์ ESP32 หรืออุปกรณ์ BLE อัจฉริยะ
                  </p>
                </div>

                {bleConnected ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#edf7f0] text-[#247452] text-xs font-bold border border-[#d6ebd9]">
                      ✓ เชื่อมต่อสำเร็จ (Connected)
                    </span>
                    <button
                      type="button"
                      onClick={handleDisconnectBle}
                      className="px-3 py-1 rounded-full bg-white border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold"
                    >
                      ตัดการเชื่อมต่อ
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleScanBluetooth}
                    disabled={isScanning}
                    className="h-11 px-5 rounded-xl bg-[#9b1008] hover:bg-[#790b04] text-white font-semibold text-xs flex items-center justify-center gap-2 mx-auto transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    <BluetoothSearching className="w-4 h-4" />
                    <span>{isScanning ? 'กำลังสแกนค้นหา...' : 'สแกนจับคู่อุปกรณ์บลูทูธ (Scan BLE)'}</span>
                  </button>
                )}

                {bleStatusMsg && (
                  <p className="text-[11px] text-[#718078] font-mono">{bleStatusMsg}</p>
                )}
              </div>

              {!isBleSupported && (
                <div className="p-3 rounded-xl bg-[#fff9ec] border border-[#f0e4c7] text-[#74643e] text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-[#d97706] flex-shrink-0" />
                  <span>
                    เบราว์เซอร์นี้ยังไม่เปิดใช้งาน Web Bluetooth API (แนะนำเปิดผ่าน Google Chrome บน Windows/Mac/Android)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#e6ebe7] bg-[#fbfcfb] flex items-center justify-between">
          <span className="text-[11px] text-[#87928c]">
            {bleConnected ? `เชื่อมต่อ: ${bleDeviceName}` : 'อุปกรณ์เสียงพร้อมใช้งาน'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="h-9 px-5 rounded-xl bg-[#9b1008] text-white text-xs font-semibold hover:bg-[#790b04] transition-all shadow-xs"
          >
            บันทึกและปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
}
