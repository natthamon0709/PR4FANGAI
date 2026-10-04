import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { uploadToStorage, isSupabaseConfigured } from './supabase';

export interface TTSOptions {
  text: string;
  voiceGender?: 'female' | 'male';
  speed?: number; // 0.5 - 2.0, default 1.0
  publicBaseUrl?: string;
  dialect?: 'kham_mueang' | 'central';
}

export interface TTSResult {
  success: boolean;
  audioUrl?: string;
  durationMs: number;
  filename?: string;
  error?: string;
}

const VOICE_MAP = {
  female: 'th-TH-PremwadeeNeural', // เสียงเปรมวดี: โทนสุภาพ อบอุ่น นุ่มนวล เหมาะกับ "เจ้า"
  male: 'th-TH-NiwatNeural'         // เสียงนิวัฒน์: โทนสุขุม ทางการ น่าเชื่อถือ
};

/**
 * Advanced Thai & Kham Mueang Phonetic Normalizer & Prosody Enhancer for Speech:
 * - Expands educational abbreviations (ปวช., ปวส., ป.ตรี, ผอ., อ., ว่าที่ ร.ต.)
 * - Normalizes phone numbers (053-451111 -> 0 5 3, 4 5 1 1 1 1)
 * - Normalizes times (08.30 น. -> 8 นาฬิกา 30 นาที)
 * - Normalizes dates & years (พ.ศ. 2567 -> พุทธศักราช 2567)
 * - Normalizes symbols (%, /, +, -, @)
 * - Inserts natural breathing pauses and commas after polite particles (เจ้า, เน้อเจ้า, นะคะ, ครับ, ค่ะ)
 * - Structures list items with natural transitional pauses
 */
export function normalizeThaiForSpeech(text: string): string {
  if (!text) return '';

  let t = text;

  // 1. Remove URLs and domain links
  t = t.replace(/https?:\/\/[^\s)]+/g, 'เว็บไซต์วิทยาลัยการอาชีพฝาง');
  t = t.replace(/www\.[^\s)]+/g, 'เว็บไซต์วิทยาลัยการอาชีพฝาง');

  // 2. Normalize Currency & commas inside numbers: 2,500 บาท -> 2500 บาท
  t = t.replace(/(\d+),(\d+)/g, '$1$2');

  // 3. Time formats:
  // e.g. 08:30 - 16:30 น. or 08.30-16.30 น.
  t = t.replace(/(\d{1,2})[:.](\d{2})\s*[-–—]\s*(\d{1,2})[:.](\d{2})\s*น\.?/g, '$1 นาฬิกา $2 นาที ถึง $3 นาฬิกา $4 นาที');
  // e.g. 08:30 น. or 08.30 น.
  t = t.replace(/(\d{1,2})[:.](\d{2})\s*น\.?/g, '$1 นาฬิกา $2 นาที');
  // e.g. 08.00 น. -> 8 นาฬิกา
  t = t.replace(/(\d{1,2})[:.]00\s*น\.?/g, '$1 นาฬิกาตรง');

  // 4. Phone numbers: 053-451111 or 053-451-111 or 081-234-5678
  t = t.replace(/\b(0\d{1,2})[-–—](\d{3})[-–—](\d{4})\b/g, '$1, $2, $3');
  t = t.replace(/\b(0\d{1,2})[-–—](\d{3})[-–—](\d{3})\b/g, '$1, $2, $3');
  t = t.replace(/\b(0\d{1,2})[-–—](\d{6,7})\b/g, (match, p1, p2) => {
    const p2a = p2.slice(0, 3);
    const p2b = p2.slice(3);
    return `${p1}, ${p2a}, ${p2b}`;
  });

  // 5. Academic years and calendar:
  t = t.replace(/พ\.ศ\.\s*(\d{4})/g, 'พุทธศักราช $1');
  t = t.replace(/ปีการศึกษา\s*(\d{4})/g, 'ปีการศึกษา $1');

  // 6. Educational titles & levels:
  t = t.replace(/รอง\s*ผอ\./g, 'รองผู้อำนวยการ');
  t = t.replace(/ผอ\./g, 'ผู้อำนวยการ');
  t = t.replace(/ว่าที่\s*ร\.ต\.\s*หญิง/g, 'ว่าที่ร้อยตรีหญิง ');
  t = t.replace(/ว่าที่\s*ร\.ต\./g, 'ว่าที่ร้อยตรี ');
  t = t.replace(/ดร\./g, 'ด็อกเตอร์ ');
  t = t.replace(/อ\.([ก-๙]+)/g, 'อาจารย์$1');
  t = t.replace(/วท\.ฝาง|วก\.ฝาง/g, 'วิทยาลัยการอาชีพฝาง');
  t = t.replace(/ป\.ตรี/g, 'ระดับปริญญาตรี');
  // ปวช. / ปวส. handling: ensure clean spacing so TTS neural model pronounces naturally
  t = t.replace(/ปวช\.\s*[\/และ,]+\s*ปวส\./g, 'ระดับ ปวช. และ ระดับ ปวส.');
  t = t.replace(/ปวช\./g, 'ระดับ ปวช. ');
  t = t.replace(/ปวส\./g, 'ระดับ ปวส. ');
  t = t.replace(/กศน\./g, 'กอ ศอ นอ');
  t = t.replace(/อวท\./g, 'ออ วอ ทอ');

  // 7. Symbols and punctuation:
  t = t.replace(/%/g, ' เปอร์เซ็นต์');
  t = t.replace(/และ\/หรือ/g, 'และหรือ');
  t = t.replace(/([ก-๙]+)\/([ก-๙]+)/g, '$1 หรือ $2');
  t = t.replace(/(\d+)\s*[-–—]\s*(\d+)/g, '$1 ถึง $2'); // number ranges: 1-3 -> 1 ถึง 3
  t = t.replace(/&/g, ' และ ');
  t = t.replace(/@/g, ' แอด ');
  t = t.replace(/[()]/g, ', '); // Parentheses converted to soft pauses

  // 8. Polite endings & breath points (Lanna Kham Mueang + Central):
  // Insert a natural breath pause (comma) after polite endings if not already followed by punctuation
  t = t.replace(/(เน้อเจ้า|นะเจ้า|จ๊าดนักเจ้า|แต๊เจ้า|เจ้า)(?=[^\s,.\?!;])/g, '$1, ');
  t = t.replace(/(เน้อเจ้า|นะเจ้า|จ๊าดนักเจ้า|แต๊เจ้า|เจ้า)\s+(?![,.\?!])/g, '$1, ');
  t = t.replace(/(นะคะ|นะครับ|ค่ะ|ครับ)(?=[^\s,.\?!;])/g, '$1, ');
  t = t.replace(/(นะคะ|นะครับ|ค่ะ|ครับ)\s+(?![,.\?!])/g, '$1, ');

  // 9. Natural spoken conjunction transitions:
  t = t.replace(/([^\s,])\s*(โดยเฉพาะ|นอกจากนี้|ทั้งนี้|หากมีข้อสงสัย|สามารถติดต่อได้ที่|สามารถสอบถามเพิ่มเติม)/g, '$1, $2');

  // 10. Clean up duplicate punctuation and spacing:
  t = t.replace(/,\s*,+/g, ',');
  t = t.replace(/\s+,/g, ',');
  t = t.replace(/,+/g, ', ');
  t = t.replace(/[ \t]+/g, ' ');

  return t.trim();
}

/**
 * Clean up text for natural spoken speech:
 * - Remove Markdown asterisks, headers, bullets, links, code blocks
 * - Remove system tags or emojis
 * - Keep Northern dialect phrasing intact (e.g. เจ้า, เน้อเจ้า, ตี้ไหน, ยินดีเจ้า)
 * - Apply Thai phonetic and prosody normalizer
 */
export function cleanTextForSpeech(text: string): string {
  if (!text) return '';

  let cleaned = text
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // Remove Markdown links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove markdown image syntax
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    // Remove headings (#, ##, etc.) - keep as phrase with pause
    .replace(/^#{1,6}\s+(.+)$/gm, '$1, ')
    // Convert numbered lists & bullets to spoken comma-separated phrases
    .replace(/^[\s*•\-\d.]+\s+/gm, ', ')
    // Remove bold/italics markers (*, _)
    .replace(/[*_~]/g, '')
    // Remove HTML tags
    .replace(/<[^>]+>/g, '')
    // Remove common emojis
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF]/g, '')
    // Normalize newlines to comma/period breaks instead of stripping them blindly
    .replace(/\n\s*\n+/g, '. ')
    .replace(/\n+/g, ', ');

  // Apply Thai phonetic and prosody normalizer
  cleaned = normalizeThaiForSpeech(cleaned);

  // Clean up duplicate commas, periods, spaces
  cleaned = cleaned
    .replace(/([,.])\s*[,.]+/g, '$1 ')
    .replace(/^[,\s.]+/, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Limit speech length to ~450 characters with graceful natural ending
  if (cleaned.length > 450) {
    const sliced = cleaned.slice(0, 450);
    const lastPunct = Math.max(
      sliced.lastIndexOf('เน้อเจ้า'),
      sliced.lastIndexOf('เจ้า'),
      sliced.lastIndexOf('ครับ'),
      sliced.lastIndexOf('ค่ะ'),
      sliced.lastIndexOf('.'),
      sliced.lastIndexOf(' ')
    );
    if (lastPunct > 300) {
      cleaned = sliced.slice(0, lastPunct);
      if (sliced.slice(lastPunct).includes('เจ้า')) {
        cleaned += 'เจ้า';
      }
    } else {
      cleaned = sliced + '...';
    }
  }

  return cleaned;
}

/**
 * Build SSML for Microsoft Edge Neural TTS with natural prosody and breathing pauses
 */
export function buildSsmlForSpeech(text: string, voiceName: string, speed: number = 1.0): string {
  // Base rate adjustment: default speed 1.0 produces a relaxed, warm pace (-5%)
  // This immediately removes the hurried, robotic announcer effect and sounds gentle, polite, and human.
  const baseRate = -5;
  const ratePercent = baseRate + Math.round((speed - 1.0) * 100);
  const rateStr = ratePercent >= 0 ? `+${ratePercent}%` : `${ratePercent}%`;

  // Escape special XML characters
  let ssmlBody = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Convert commas into natural SSML breaks (~220ms pause)
  ssmlBody = ssmlBody.replace(/,\s*/g, `<break time='220ms'/> `);

  // Convert periods or ellipses into sentence breaks (~380ms pause)
  ssmlBody = ssmlBody.replace(/\.\.\.\s*/g, `<break time='380ms'/> `);
  ssmlBody = ssmlBody.replace(/\.\s*/g, `<break time='350ms'/> `);

  return (
    `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='th-TH'>` +
    `<voice name='${voiceName}'><prosody pitch='+0Hz' rate='${rateStr}'>` +
    `${ssmlBody}` +
    `</prosody></voice></speak>`
  );
}

/**
 * Approximate or calculate MP3 duration in milliseconds
 */
export function calculateMp3Duration(buffer: Buffer): number {
  if (!buffer || buffer.length === 0) return 3000;

  // Search for MPEG sync word (0xFF 0xFB, 0xFF 0xF3, 0xFF 0xF2)
  let offset = 0;
  let frameCount = 0;
  let totalSamples = 0;
  let sampleRate = 24000;

  // Check ID3v2 header
  if (buffer.length > 10 && buffer.toString('ascii', 0, 3) === 'ID3') {
    const size = ((buffer[6] & 0x7f) << 21) |
                 ((buffer[7] & 0x7f) << 14) |
                 ((buffer[8] & 0x7f) << 7) |
                 (buffer[9] & 0x7f);
    offset = 10 + size;
  }

  // Iterate MPEG audio frames if possible
  const sampleRatesMpeg1 = [44100, 48000, 32000];
  const sampleRatesMpeg2 = [22050, 24000, 16000];

  while (offset + 4 < buffer.length) {
    if (buffer[offset] === 0xff && (buffer[offset + 1] & 0xe0) === 0xe0) {
      const versionBits = (buffer[offset + 1] >> 3) & 0x03;
      const srIdx = (buffer[offset + 2] >> 2) & 0x03;
      if (versionBits === 3 && srIdx < 3) {
        sampleRate = sampleRatesMpeg1[srIdx];
      } else if (versionBits === 2 && srIdx < 3) {
        sampleRate = sampleRatesMpeg2[srIdx];
      }
      frameCount++;
      totalSamples += 1152;
      offset += 144;
      if (frameCount > 2000) break;
    } else {
      offset++;
    }
  }

  if (frameCount > 5 && sampleRate > 0) {
    return Math.max(1500, Math.round((totalSamples / sampleRate) * 1000));
  }

  // Fallback: estimate from 48kbps bitrate (Edge-TTS mono mp3)
  const estimatedMs = Math.round((buffer.length / 6000) * 1000);
  return Math.max(2000, Math.min(60000, estimatedMs));
}

/**
 * Synthesize speech via Microsoft Edge Neural TTS (High quality, free, natural Thai neural voice)
 */
async function synthesizeViaEdgeTts(text: string, voiceName: string, speed: number = 1.0): Promise<Buffer | null> {
  if (typeof globalThis.WebSocket === 'undefined') return null;

  return new Promise<Buffer | null>((resolve) => {
    let timeoutId: NodeJS.Timeout;
    try {
      const connId = crypto.randomUUID().replace(/-/g, '');
      const reqId = crypto.randomUUID().replace(/-/g, '');
      const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readahead/edge/v1?TrustedClientToken=6A5AA1D4EA654081830088481A31D63F&ConnectionId=${connId}`;

      const ws = new globalThis.WebSocket(wsUrl, {
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
          'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold'
        }
      } as any);

      const audioChunks: Buffer[] = [];

      timeoutId = setTimeout(() => {
        try { ws.close(); } catch {}
        if (audioChunks.length > 0) {
          resolve(Buffer.concat(audioChunks));
        } else {
          resolve(null);
        }
      }, 7000);

      ws.onopen = () => {
        // 1. Send speech config
        const configMsg =
          'Content-Type:application/json; charset=utf-8\r\n' +
          'Path:speech.config\r\n\r\n' +
          JSON.stringify({
            context: {
              synthesis: {
                audio: {
                  metadataoptions: { sentenceBoundaryEnabled: 'false', wordBoundaryEnabled: 'false' },
                  outputFormat: 'audio-24khz-48kbitrate-mono-mp3'
                }
              }
            }
          });
        ws.send(configMsg);

        // 2. Format SSML with natural breathing pauses and warm, human prosody
        const ssml = buildSsmlForSpeech(text, voiceName, speed);

        const ssmlMsg =
          `X-RequestId:${reqId}\r\n` +
          'Content-Type:application/ssml+xml\r\n' +
          'Path:ssml\r\n\r\n' +
          ssml;
        ws.send(ssmlMsg);
      };

      ws.onmessage = (event: any) => {
        const data = event.data;
        if (typeof data === 'string') {
          if (data.includes('Path:turn.end')) {
            clearTimeout(timeoutId);
            try { ws.close(); } catch {}
            if (audioChunks.length > 0) {
              resolve(Buffer.concat(audioChunks));
            } else {
              resolve(null);
            }
          }
        } else if (data instanceof ArrayBuffer) {
          const buf = Buffer.from(data);
          if (buf.length > 2) {
            const headerLen = buf.readUInt16BE(0);
            if (buf.length > 2 + headerLen) {
              const audioBytes = buf.subarray(2 + headerLen);
              audioChunks.push(audioBytes);
            }
          }
        }
      };

      ws.onerror = () => {
        clearTimeout(timeoutId);
        resolve(audioChunks.length > 0 ? Buffer.concat(audioChunks) : null);
      };

      ws.onclose = () => {
        clearTimeout(timeoutId);
        resolve(audioChunks.length > 0 ? Buffer.concat(audioChunks) : null);
      };
    } catch {
      if (timeoutId!) clearTimeout(timeoutId);
      resolve(null);
    }
  });
}

/**
 * Synthesize speech via Google Translate TTS (Reliable HTTP Fallback)
 */
async function synthesizeViaGoogleTts(text: string): Promise<Buffer | null> {
  try {
    const chunks: string[] = [];
    let remaining = text;
    while (remaining.length > 0) {
      if (remaining.length <= 150) {
        chunks.push(remaining);
        break;
      }
      let idx = remaining.lastIndexOf(' ', 150);
      if (idx === -1) idx = 150;
      chunks.push(remaining.slice(0, idx));
      remaining = remaining.slice(idx).trim();
    }

    const buffers: Buffer[] = [];
    for (const chunk of chunks) {
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(chunk)}&tl=th&client=tw-ob`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) {
        const ab = await res.arrayBuffer();
        buffers.push(Buffer.from(ab));
      }
    }

    if (buffers.length > 0) {
      return Buffer.concat(buffers);
    }
  } catch {}
  return null;
}

/**
 * Generate a minimalist silent / acoustic fallback MP3 (2 seconds)
 * Ensures LINE API message send will NEVER crash or be rejected
 */
function createFallbackMp3(): Buffer {
  const frameHeader = Buffer.from([0xff, 0xfb, 0x30, 0xc4]);
  const frameBody = Buffer.alloc(188, 0x00);
  const singleFrame = Buffer.concat([frameHeader, frameBody]);
  const frameList: Buffer[] = [];
  for (let i = 0; i < 50; i++) {
    frameList.push(singleFrame);
  }
  return Buffer.concat(frameList);
}

/**
 * Main Text-to-Speech Audio Generation Function
 */
export async function generateAudioReply(options: TTSOptions): Promise<TTSResult> {
  const {
    text,
    voiceGender = 'female',
    speed = 1.0,
    publicBaseUrl = ''
  } = options;

  const cleanText = cleanTextForSpeech(text);
  if (!cleanText || cleanText.length < 2) {
    return {
      success: false,
      durationMs: 0,
      error: 'ข้อความสำหรับสังเคราะห์เสียงสั้นเกินไป'
    };
  }

  const voiceName = VOICE_MAP[voiceGender] || VOICE_MAP.female;
  let audioBuffer: Buffer | null = null;

  // 1. Try Microsoft Edge Neural TTS (Natural, sweet, warm voice)
  try {
    audioBuffer = await synthesizeViaEdgeTts(cleanText, voiceName, speed);
  } catch {}

  // 2. Fallback to Google TTS if Edge was unreachable
  if (!audioBuffer || audioBuffer.length < 500) {
    try {
      audioBuffer = await synthesizeViaGoogleTts(cleanText);
    } catch {}
  }

  // 3. Fallback to minimal valid audio frame if completely offline
  if (!audioBuffer || audioBuffer.length < 500) {
    audioBuffer = createFallbackMp3();
  }

  const durationMs = calculateMp3Duration(audioBuffer);
  const audioId = `voice-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
  const filename = `${audioId}.mp3`;

  // 4. Save to local storage (or /tmp on serverless environments like Vercel)
  const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT);
  const audioDir = isServerless 
    ? path.join('/tmp', 'audio', 'responses')
    : path.join(process.cwd(), 'public', 'audio', 'responses');
  try {
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }
    fs.writeFileSync(path.join(audioDir, filename), audioBuffer);
  } catch (fsErr) {
    console.warn('Warning writing local audio file:', fsErr);
  }

  // 5. If Supabase Storage is configured, upload to pr4fang-media bucket for global CDN access
  let finalAudioUrl = '';
  if (isSupabaseConfigured()) {
    try {
      const uploadRes = await uploadToStorage(filename, audioBuffer, 'audio/mpeg', 'audio-replies');
      if (uploadRes.success && uploadRes.url) {
        finalAudioUrl = uploadRes.url;
      }
    } catch (sbErr) {
      console.warn('Supabase audio upload warning:', sbErr);
    }
  }

  // 6. If not on Supabase or failed, use public HTTP/HTTPS URL
  if (!finalAudioUrl) {
    const cleanBase = (publicBaseUrl || process.env.NEXT_PUBLIC_APP_URL || '').replace(/\/+$/, '');
    if (cleanBase && cleanBase.startsWith('http')) {
      finalAudioUrl = `${cleanBase}/api/audio/${filename}`;
    } else {
      finalAudioUrl = `/api/audio/${filename}`;
    }
  }

  return {
    success: true,
    audioUrl: finalAudioUrl,
    durationMs,
    filename
  };
}
