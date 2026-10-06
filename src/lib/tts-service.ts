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

const THAI_DIGIT_WORDS: Record<string, string> = {
  '0': 'ศูนย์',
  '1': 'หนึ่ง',
  '2': 'สอง',
  '3': 'สาม',
  '4': 'สี่',
  '5': 'ห้า',
  '6': 'หก',
  '7': 'เจ็ด',
  '8': 'แปด',
  '9': 'เก้า'
};

const THAI_UNITS = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];

/**
 * Convert integer to spoken Thai words according to proper Royal Institute grammar
 * e.g. 2500 -> สองพันห้าร้อย, 2567 -> สองพันห้าร้อยหกสิบเจ็ด, 21 -> ยี่สิบเอ็ด
 */
export function numberToThaiWords(num: number | string): string {
  const cleanStr = String(num).replace(/,/g, '').trim();
  const n = parseInt(cleanStr, 10);
  if (isNaN(n)) return String(num);
  if (n === 0) return 'ศูนย์';
  if (n < 0) return 'ลบ' + numberToThaiWords(Math.abs(n));

  if (n >= 1000000) {
    const millions = Math.floor(n / 1000000);
    const remainder = n % 1000000;
    return numberToThaiWords(millions) + 'ล้าน' + (remainder > 0 ? numberToThaiWords(remainder) : '');
  }

  const digits = n.toString().split('').map(Number);
  const len = digits.length;
  let result = '';

  for (let i = 0; i < len; i++) {
    const digit = digits[i];
    const unitIndex = len - i - 1;
    if (digit === 0) continue;

    if (unitIndex === 0 && digit === 1 && len > 1 && digits[len - 2] !== 0) {
      result += 'เอ็ด';
    } else if (unitIndex === 1 && digit === 1) {
      result += 'สิบ';
    } else if (unitIndex === 1 && digit === 2) {
      result += 'ยี่สิบ';
    } else {
      result += (THAI_DIGIT_WORDS[String(digit)] || '') + THAI_UNITS[unitIndex];
    }
  }

  return result;
}

/**
 * Convert individual digits to spaced Thai words
 * e.g. '053' -> 'ศูนย์ ห้า สาม'
 */
export function digitsToSpokenThai(digitStr: string): string {
  return digitStr
    .split('')
    .map(d => THAI_DIGIT_WORDS[d] || d)
    .join(' ');
}

/**
 * Advanced Thai & Kham Mueang Phonetic Normalizer & Prosody Enhancer for Speech:
 * - Expands educational abbreviations (ปวช., ปวส., ป.ตรี, ผอ., อ., ว่าที่ ร.ต.)
 * - Normalizes phone numbers to spoken digits (053-451111 -> ศูนย์ ห้า สาม, สี่ ห้า หนึ่ง, หนึ่ง หนึ่ง หนึ่ง หนึ่ง)
 * - Normalizes times (08.30 น. -> แปด นาฬิกา สามสิบ นาที)
 * - Normalizes dates & years (พ.ศ. 2567 -> พุทธศักราช สองพันห้าร้อยหกสิบเจ็ด)
 * - Normalizes currency (2,500 บาท -> สองพันห้าร้อย บาท)
 * - Normalizes percentages (10.5% -> สิบจุดห้า เปอร์เซ็นต์)
 * - Inserts natural breathing pauses and commas after polite particles
 */
export function normalizeThaiForSpeech(text: string): string {
  if (!text) return '';

  let t = text;

  // 1. Remove URLs and domain links
  t = t.replace(/https?:\/\/[^\s)]+/g, 'เว็บไซต์วิทยาลัยการอาชีพฝาง');
  t = t.replace(/www\.[^\s)]+/g, 'เว็บไซต์วิทยาลัยการอาชีพฝาง');

  // 2. Phone numbers & extensions (Normalize before general numbers to preserve leading zero):
  // Extension: ต่อ 123
  t = t.replace(/(?:ต่อ|เบอร์ต่อ)\s*(\d{2,5})\b/g, (m, ext) => `ต่อ ${digitsToSpokenThai(ext)}`);

  // Mobile: 08x-xxx-xxxx, 09x-xxx-xxxx, 06x-xxx-xxxx
  t = t.replace(/\b(0[689]\d)[-–—\s](\d{3})[-–—\s](\d{4})\b/g, (m, p1, p2, p3) => {
    return `${digitsToSpokenThai(p1)}, ${digitsToSpokenThai(p2)}, ${digitsToSpokenThai(p3)}`;
  });
  t = t.replace(/\b(0[689]\d)(\d{3})(\d{4})\b/g, (m, p1, p2, p3) => {
    return `${digitsToSpokenThai(p1)}, ${digitsToSpokenThai(p2)}, ${digitsToSpokenThai(p3)}`;
  });

  // Landline: 053-451111, 053-451-111, 053-451234
  t = t.replace(/\b(0\d{1,2})[-–—\s](\d{3})[-–—\s](\d{3,4})\b/g, (m, p1, p2, p3) => {
    return `${digitsToSpokenThai(p1)}, ${digitsToSpokenThai(p2)}, ${digitsToSpokenThai(p3)}`;
  });
  t = t.replace(/\b(0\d{1,2})[-–—](\d{6,7})\b/g, (match, p1, p2) => {
    const p2a = p2.slice(0, 3);
    const p2b = p2.slice(3);
    return `${digitsToSpokenThai(p1)}, ${digitsToSpokenThai(p2a)}, ${digitsToSpokenThai(p2b)}`;
  });
  // Clean continuous 9-10 digit numbers starting with 0 when preceded by call/phone keywords
  t = t.replace(/(โทรศัพท์|เบอร์โทร|โทร|เบอร์|ติดต่อ)\s*(?:ที่|:)?\s*(0\d{8,9})\b/g, (m, kw, phone) => {
    const p1 = phone.slice(0, 3);
    const p2 = phone.slice(3, 6);
    const p3 = phone.slice(6);
    return `${kw} ${digitsToSpokenThai(p1)}, ${digitsToSpokenThai(p2)}, ${digitsToSpokenThai(p3)}`;
  });

  // 3. Time formats:
  // e.g. 08:30 - 16:30 น. or 08.30-16.30 น.
  t = t.replace(/(\d{1,2})[:.](\d{2})\s*[-–—]\s*(\d{1,2})[:.](\d{2})\s*น\.?/g, (m, h1, m1, h2, m2) => {
    const min1Str = m1 === '00' ? '' : ` ${numberToThaiWords(m1)} นาที`;
    const min2Str = m2 === '00' ? 'ตรง' : ` ${numberToThaiWords(m2)} นาที`;
    return `${numberToThaiWords(h1)} นาฬิกา${min1Str} ถึง ${numberToThaiWords(h2)} นาฬิกา${min2Str}`;
  });
  // e.g. 08:30 น. or 08.30 น.
  t = t.replace(/(\d{1,2})[:.](\d{2})\s*น\.?/g, (m, h, min) => {
    const minStr = min === '00' ? 'ตรง' : ` ${numberToThaiWords(min)} นาที`;
    return `${numberToThaiWords(h)} นาฬิกา${minStr}`;
  });

  // 4. Currency: 2,500 บาท -> สองพันห้าร้อย บาท
  t = t.replace(/(\d[\d,]*)\s*(บาท|สตางค์)/g, (m, val, unit) => `${numberToThaiWords(val)} ${unit}`);

  // 5. Academic years and calendar:
  t = t.replace(/พ\.ศ\.\s*(\d{4})/g, (m, y) => `พุทธศักราช ${numberToThaiWords(y)}`);
  t = t.replace(/ปีการศึกษา\s*(\d{4})/g, (m, y) => `ปีการศึกษา ${numberToThaiWords(y)}`);
  t = t.replace(/ค\.ศ\.\s*(\d{4})/g, (m, y) => `คริสต์ศักราช ${numberToThaiWords(y)}`);

  // 6. Dates: วันที่ 15 -> วันที่ สิบห้า
  t = t.replace(/วันที่\s*(\d{1,2})\b/g, (m, d) => `วันที่ ${numberToThaiWords(d)}`);

  // 7. Decimals & Percentages:
  t = t.replace(/(\d+)\.(\d+)\s*%/g, (m, intPart, decPart) => `${numberToThaiWords(intPart)}จุด${digitsToSpokenThai(decPart)} เปอร์เซ็นต์`);
  t = t.replace(/(\d+)\s*%/g, (m, val) => `${numberToThaiWords(val)} เปอร์เซ็นต์`);
  t = t.replace(/(\d+)\.(\d+)\b/g, (m, intPart, decPart) => `${numberToThaiWords(intPart)}จุด${digitsToSpokenThai(decPart)}`);

  // 8. Number ranges with units: 1-3 วัน -> หนึ่ง ถึง สาม วัน
  t = t.replace(/(\d+)\s*[-–—]\s*(\d+)\s*(วัน|เดือน|ปี|คน|ชั่วโมง|นาที|เทอม|ภาคเรียน)/g, (m, n1, n2, u) => {
    return `${numberToThaiWords(n1)} ถึง ${numberToThaiWords(n2)} ${u}`;
  });
  t = t.replace(/(\d+)\s*[-–—]\s*(\d+)\b/g, (m, n1, n2) => `${numberToThaiWords(n1)} ถึง ${numberToThaiWords(n2)}`);

  // 9. Buildings, Floors, and Rooms:
  t = t.replace(/อาคาร\s*(\d+)\b/g, (m, b) => `อาคาร ${numberToThaiWords(b)}`);
  t = t.replace(/ชั้น\s*(\d+)\b/g, (m, fl) => `ชั้น ${numberToThaiWords(fl)}`);
  t = t.replace(/ห้อง\s*(\d{2,4})\b/g, (m, rm) => `ห้อง ${digitsToSpokenThai(rm)}`);

  // 10. Educational titles & levels:
  t = t.replace(/รอง\s*ผอ\./g, 'รองผู้อำนวยการ');
  t = t.replace(/ผอ\./g, 'ผู้อำนวยการ');
  t = t.replace(/ว่าที่\s*ร\.ต\.\s*หญิง/g, 'ว่าที่ร้อยตรีหญิง ');
  t = t.replace(/ว่าที่\s*ร\.ต\./g, 'ว่าที่ร้อยตรี ');
  t = t.replace(/ดร\./g, 'ด็อกเตอร์ ');
  t = t.replace(/อ\.([ก-๙]+)/g, 'อาจารย์$1');
  t = t.replace(/วท\.ฝาง|วก\.ฝาง/g, 'วิทยาลัยการอาชีพฝาง');
  t = t.replace(/ป\.ตรี/g, 'ระดับปริญญาตรี');
  t = t.replace(/(?:ระดับ\s*)?ปวช\.\s*[\/และ,]+\s*(?:ระดับ\s*)?ปวส\./g, 'ระดับ ปวช. และระดับ ปวส.');
  t = t.replace(/(?:ระดับ\s*)?ปวช\.\s*(\d)\b/g, (m, yr) => `ระดับ ปวช. ชั้นปีที่ ${numberToThaiWords(yr)} `);
  t = t.replace(/(?:ระดับ\s*)?ปวส\.\s*(\d)\b/g, (m, yr) => `ระดับ ปวส. ชั้นปีที่ ${numberToThaiWords(yr)} `);
  t = t.replace(/(?:ระดับ\s*)?ปวช\./g, 'ระดับ ปวช. ');
  t = t.replace(/(?:ระดับ\s*)?ปวส\./g, 'ระดับ ปวส. ');
  t = t.replace(/(?:ระดับ\s*){2,}/g, 'ระดับ ');
  t = t.replace(/กศน\./g, 'กอ ศอ นอ');
  t = t.replace(/อวท\./g, 'ออ วอ ทอ');

  // 11. Symbols and punctuation:
  t = t.replace(/และ\/หรือ/g, 'และหรือ');
  t = t.replace(/([ก-๙]+)\/([ก-๙]+)/g, '$1 หรือ $2');
  t = t.replace(/&/g, ' และ ');
  t = t.replace(/@/g, ' แอด ');
  t = t.replace(/[()]/g, ', ');

  // 12. Polite endings & breath points:
  t = t.replace(/(เน้อเจ้า|นะเจ้า|จ๊าดนักเจ้า|แต๊เจ้า|เจ้า)(?=[^\s,.\?!;])/g, '$1, ');
  t = t.replace(/(เน้อเจ้า|นะเจ้า|จ๊าดนักเจ้า|แต๊เจ้า|เจ้า)\s+(?![,.\?!])/g, '$1, ');
  t = t.replace(/(เน้อครับ|นะครับ|ครับผม|ครับ|นะคะ|ค่ะ)(?=[^\s,.\?!;])/g, '$1, ');
  t = t.replace(/(เน้อครับ|นะครับ|ครับผม|ครับ|นะคะ|ค่ะ)\s+(?![,.\?!])/g, '$1, ');

  // 13. Natural spoken conjunction transitions:
  t = t.replace(/([^\s,])\s*(โดยเฉพาะ|นอกจากนี้|ทั้งนี้|หากมีข้อสงสัย|สามารถติดต่อได้ที่|สามารถสอบถามเพิ่มเติม)/g, '$1, $2');

  // 14. Clean up duplicate punctuation and spacing:
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
 * - If text is long, summarize gracefully under 45 seconds with natural closing wrap-up
 */
export function cleanTextForSpeech(
  text: string,
  voiceGender: 'female' | 'male' = 'female',
  dialect: 'kham_mueang' | 'central' = 'central'
): string {
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
    // Normalize newlines to comma/period breaks
    .replace(/\n\s*\n+/g, '. ')
    .replace(/\n+/g, ', ');

  // Enforce gender persona particles strictly
  cleaned = cleaned.replace(/ครับ\/ค่ะ/g, voiceGender === 'male' ? 'ครับ' : 'ค่ะ');
  cleaned = cleaned.replace(/ค่ะ\/ครับ/g, voiceGender === 'male' ? 'ครับ' : 'ค่ะ');
  cleaned = cleaned.replace(/ครับ\s*\/\s*ค่ะ/g, voiceGender === 'male' ? 'ครับ' : 'ค่ะ');
  cleaned = cleaned.replace(/ค่ะ\s*\/\s*ครับ/g, voiceGender === 'male' ? 'ครับ' : 'ค่ะ');

  if (voiceGender === 'female') {
    if (dialect === 'kham_mueang') {
      cleaned = cleaned.replace(/เน้อครับ/g, 'เน้อเจ้า');
      cleaned = cleaned.replace(/ยินดีครับ/g, 'ยินดีเจ้า');
      cleaned = cleaned.replace(/สุมาเต๊อะครับ/g, 'สุมาเต๊อะเจ้า');
      cleaned = cleaned.replace(/นะครับ/g, 'เน้อเจ้า');
      cleaned = cleaned.replace(/ครับ(?=[ \n.,!?•]|$)/g, 'เจ้า');
    } else {
      cleaned = cleaned.replace(/นะครับ/g, 'นะคะ');
      cleaned = cleaned.replace(/ครับ(?=[ \n.,!?•]|$)/g, 'ค่ะ');
      cleaned = cleaned.replace(/เน้อเจ้า/g, 'นะคะ');
      cleaned = cleaned.replace(/เจ้า(?=[ \n.,!?•]|$)/g, 'ค่ะ');
    }
  } else {
    // Male
    if (dialect === 'kham_mueang') {
      cleaned = cleaned.replace(/เน้อเจ้า/g, 'เน้อครับ');
      cleaned = cleaned.replace(/ยินดีเจ้า/g, 'ยินดีครับ');
      cleaned = cleaned.replace(/สุมาเต๊อะเจ้า/g, 'สุมาเต๊อะครับ');
      cleaned = cleaned.replace(/เจ้า(?=[ \n.,!?•]|$)/g, 'ครับ');
      cleaned = cleaned.replace(/นะคะ/g, 'นะครับ');
      cleaned = cleaned.replace(/ค่ะ/g, 'ครับ');
      cleaned = cleaned.replace(/คะ(?=[ \n.,!?•]|$)/g, 'ครับ');
    } else {
      cleaned = cleaned.replace(/นะคะ/g, 'นะครับ');
      cleaned = cleaned.replace(/ค่ะ/g, 'ครับ');
      cleaned = cleaned.replace(/คะ(?=[ \n.,!?•]|$)/g, 'ครับ');
      cleaned = cleaned.replace(/เน้อเจ้า/g, 'นะครับ');
      cleaned = cleaned.replace(/เจ้า(?=[ \n.,!?•]|$)/g, 'ครับ');
    }
  }

  // Apply Thai phonetic and prosody normalizer
  cleaned = normalizeThaiForSpeech(cleaned);

  // Clean up duplicate commas, periods, spaces
  cleaned = cleaned
    .replace(/([,.])\s*[,.]+/g, '$1 ')
    .replace(/^[,\s.]+/, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Limit spoken speech length to ~270 characters (approx 30-40 seconds)
  // Ensures audio NEVER exceeds LINE Messaging API 60-second limit and ends gracefully
  if (cleaned.length > 270) {
    const sliced = cleaned.slice(0, 270);
    const lastPunct = Math.max(
      sliced.lastIndexOf('เน้อเจ้า'),
      sliced.lastIndexOf('เน้อครับ'),
      sliced.lastIndexOf('เจ้า'),
      sliced.lastIndexOf('ครับ'),
      sliced.lastIndexOf('ค่ะ'),
      sliced.lastIndexOf('.'),
      sliced.lastIndexOf(','),
      sliced.lastIndexOf(' ')
    );

    let naturalWrap = '';
    if (dialect === 'kham_mueang') {
      naturalWrap = voiceGender === 'male'
        ? ', สามารถผ่อรายละเอียดเพิ่มเติมทั้งหมดตี้ข้อความด้านบนได้เลยเน้อครับ'
        : ', สามารถผ่อรายละเอียดเพิ่มเติมทั้งหมดตี้ข้อความด้านบนได้เลยเน้อเจ้า';
    } else {
      naturalWrap = voiceGender === 'male'
        ? ', สามารถดูรายละเอียดเพิ่มเติมทั้งหมดได้จากข้อความด้านบนได้เลยนะครับ'
        : ', สามารถดูรายละเอียดเพิ่มเติมทั้งหมดได้จากข้อความด้านบนได้เลยนะคะ';
    }

    if (lastPunct > 150) {
      cleaned = sliced.slice(0, lastPunct).trim() + naturalWrap;
    } else {
      cleaned = sliced.trim() + naturalWrap;
    }
  }

  return cleaned;
}

/**
 * Build SSML for Microsoft Edge Neural TTS with natural prosody and breathing pauses
 */
export function buildSsmlForSpeech(
  text: string, 
  voiceName: string, 
  speed: number = 1.0, 
  dialect: 'kham_mueang' | 'central' = 'central'
): string {
  // Base rate adjustment: default speed 1.0 produces a relaxed, warm pace (-5%)
  // For Kham Mueang (Northern dialect), apply a melodic, gentle cadence (-9%)
  const baseRate = dialect === 'kham_mueang' ? -9 : -5;
  const ratePercent = baseRate + Math.round((speed - 1.0) * 100);
  const rateStr = ratePercent >= 0 ? `+${ratePercent}%` : `${ratePercent}%`;

  // Escape special XML characters
  let ssmlBody = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  if (dialect === 'kham_mueang') {
    // Insert natural melodious breath pauses after Northern polite particles
    ssmlBody = ssmlBody.replace(/(เน้อเจ้า|กะเจ้า|เจ้าข้า|ยินดีเจ้า|เจ้า|เน้อ)\s*/g, `$1<break time='320ms'/> `);
  }

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

const WIN_EPOCH = 11644473600n;
const S_TO_NS = 1000000000n;
const EDGE_TRUSTED_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4';

function getEdgeSecMsGec(): string {
  const unixNow = BigInt(Math.floor(Date.now() / 1000));
  let ticks = unixNow + WIN_EPOCH;
  ticks -= ticks % 300n;
  ticks *= (S_TO_NS / 100n);
  const strToHash = ticks.toString() + EDGE_TRUSTED_TOKEN;
  return crypto.createHash('sha256').update(strToHash, 'ascii').digest('hex').toUpperCase();
}

/**
 * Synthesize speech via Microsoft Edge Neural TTS (High quality, free, natural Thai neural voice)
 * Works for both Female (PremwadeeNeural) and Male (NiwatNeural)
 */
async function synthesizeViaEdgeTts(
  text: string, 
  voiceName: string, 
  speed: number = 1.0, 
  dialect: 'kham_mueang' | 'central' = 'central'
): Promise<Buffer | null> {
  if (typeof globalThis.WebSocket === 'undefined') return null;

  return new Promise<Buffer | null>((resolve) => {
    let timeoutId: NodeJS.Timeout;
    try {
      const connId = crypto.randomUUID().replace(/-/g, '');
      const reqId = crypto.randomUUID().replace(/-/g, '');
      const gec = getEdgeSecMsGec();
      const muid = crypto.randomBytes(16).toString('hex').toUpperCase();

      const wsUrl = `wss://speech.platform.bing.com/consumer/speech/synthesize/readaloud/edge/v1?TrustedClientToken=${EDGE_TRUSTED_TOKEN}&Sec-MS-GEC=${gec}&Sec-MS-GEC-Version=1-143.0.3650.75&ConnectionId=${connId}`;

      const ws = new globalThis.WebSocket(wsUrl, {
        headers: {
          'Pragma': 'no-cache',
          'Cache-Control': 'no-cache',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36 Edg/143.0.0.0',
          'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
          'Cookie': `muid=${muid};`
        }
      } as any);

      (ws as any).binaryType = 'arraybuffer';
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
        const ssml = buildSsmlForSpeech(text, voiceName, speed, dialect);

        const ssmlMsg =
          `X-RequestId:${reqId}\r\n` +
          'Content-Type:application/ssml+xml\r\n' +
          'Path:ssml\r\n\r\n' +
          ssml;
        ws.send(ssmlMsg);
      };

      ws.onmessage = async (event: any) => {
        let data = event.data;
        if (typeof Blob !== 'undefined' && data instanceof Blob) {
          data = await data.arrayBuffer();
        }
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
    publicBaseUrl = '',
    dialect = 'central'
  } = options;

  const cleanText = cleanTextForSpeech(text, voiceGender, dialect);
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
    audioBuffer = await synthesizeViaEdgeTts(cleanText, voiceName, speed, dialect);
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
