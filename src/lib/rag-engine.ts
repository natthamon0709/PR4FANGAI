import getDb from './db';
import { supabaseAdmin } from './supabase';
import crypto from 'crypto';
import { decryptApiKey } from './ai-crypto';
import { generateAudioReply } from './tts-service';
import { AiEngineConfig, AiRetrievedSource, RAGPlaygroundResult, DocumentAttachmentInfo, TeacherMediaInfo } from '@/types/ai';

export interface RAGExecutionResult {
  log_id?: string;
  question: string;
  answer: string;
  confidence_score: number;
  is_fallback: boolean;
  response_time_ms: number;
  imageUrl?: string;
  imageCaption?: string;
  isWebAttachment?: boolean;
  matchedTeachers?: TeacherMediaInfo[];
  documentAttachment?: DocumentAttachmentInfo;
  audioUrl?: string;
  audioDurationMs?: number;
  detectedDialect?: 'kham_mueang' | 'central';
  transcribedQuestion?: string;
  voiceGender?: 'female' | 'male';
  sources: {
    knowledge_id: string;
    title: string;
    content_type: string;
    department_name: string;
    relevance_score: number;
    rank: number;
  }[];
}

export function getActiveAiConfig(): AiEngineConfig {
  const db = getDb();
  const row = db.prepare('SELECT * FROM ai_engine_configs WHERE is_active = 1 LIMIT 1').get() as any;
  if (!row) {
    return {
      config_id: 'cfg-default',
      provider: 'gemini',
      model_name: 'gemini-3.1-flash-lite',
      api_key_masked: '••••••••4f2a',
      api_key_encrypted: '',
      system_prompt: 'คุณคือผู้ช่วย AI อัจฉริยะประจำวิทยาลัยการอาชีพฝาง ให้ตอบคำถามอย่างสุภาพ ถูกต้อง กระชับ และอ้างอิงจากข้อมูลองค์ความรู้ที่ได้รับเท่านั้น ห้ามคาดเดาข้อมูลที่ไม่ปรากฏในเอกสาร',
      confidence_threshold: 0.70,
      retrieval_top_k: 5,
      temperature: 0.3,
      is_active: true,
      voice_reply_enabled: true,
      voice_gender: 'female',
      voice_dialect_mode: 'adaptive',
      voice_speed: 1.0
    };
  }
  return {
    config_id: row.config_id,
    provider: row.provider,
    model_name: row.model_name,
    api_key_masked: row.api_key_encrypted ? row.api_key_encrypted.slice(-4) : '••••',
    api_key_encrypted: row.api_key_encrypted,
    system_prompt: row.system_prompt,
    confidence_threshold: Number(row.confidence_threshold) || 0.70,
    retrieval_top_k: Number(row.retrieval_top_k) || 5,
    temperature: Number(row.temperature) || 0.3,
    is_active: Boolean(row.is_active),
    voice_reply_enabled: row.voice_reply_enabled !== undefined ? Boolean(row.voice_reply_enabled) : true,
    voice_gender: row.voice_gender || 'female',
    voice_dialect_mode: row.voice_dialect_mode || 'adaptive',
    voice_speed: Number(row.voice_speed) || 1.0,
    updated_by: row.updated_by,
    updated_at: row.updated_at
  };
}

// Question particles, modal verbs, conversational fluff and institution stopwords in Thai
const QUESTION_STOPWORDS = new Set([
  'หรือไม่', 'หรือเปล่า', 'รึเปล่า', 'ไหม', 'มั้ย', 'หรือยัง', 'รึยัง',
  'ได้ไหม', 'ได้มั้ย', 'อย่างไร', 'ยังไง', 'ทำไม', 'เมื่อไหร่', 'ที่ไหน',
  'เท่าไหร่', 'กี่', 'คนไหน', 'ใคร', 'อะไร', 'บ้าง', 'ต้อง', 'ควร', 'จะ',
  'อยากทราบ', 'ขอถาม', 'บอกหน่อย', 'ช่วยบอก', 'มีไหม', 'มีมั้ย', 'ใช่ไหม', 'ใช่มั้ย',
  'วิทยาลัย', 'วิทยาลัยการอาชีพฝาง', 'การอาชีพฝาง', 'อาชีพฝาง', 'ฝาง',
  'จังหวัดเชียงใหม่', 'เชียงใหม่', 'เรื่อง', 'ประจำปี', 'ประจำ', 'ของ',
  'และ', 'หรือ', 'ที่', 'ใน', 'เป็น', 'ได้', 'มี', 'ไป', 'มา', 'กับ', 'ให้',
  'โดย', 'คือ', 'นี้', 'นั้น', 'ขอ', 'ทราบ', 'ช่วย', 'บอก', 'ข้อมูล', 'รายละเอียด',
  'ครับ', 'ค่ะ', 'นะ', 'คะ', 'หน่อย', 'ด้วย', 'คีับ', 'คับ', 'จ้า',
  'เจ้า', 'เน้อเจ้า', 'กะเจ้า', 'เจ้าข้า', 'เน้อ', 'กั๊บ', 'พ่อง', 'หนา', 'เน้อครับ',
  'สวัสดี', 'สวัสดีครับ', 'สวัสดีค่ะ', 'สวัสดีคีับ', 'สวัสดีคับ', 'สวัสดีเจ้า', 'หวัดดี', 'ดีครับ', 'ดีค่ะ', 'ดีเจ้า', 'ฮัลโหล',
  'ขอบคุณ', 'ขอบคุณครับ', 'ขอบคุณค่ะ', 'ขอบคุณเจ้า', 'ขอบใจ', 'ขอบใจเน้อ', 'ขอบพระคุณ', 'hello', 'hi', 'hey'
]);

export const KHAM_MUEANG_DICTIONARY: Record<string, string[]> = {
  // สถานที่ & การถามทาง
  'ตี้ไหน': ['ที่ไหน', 'สถานที่', 'ที่ตั้ง', 'แผนผัง', 'อาคาร', 'ผัง'],
  'ตี้ใด': ['ที่ไหน', 'สถานที่', 'ที่ตั้ง', 'แผนผัง', 'อาคาร'],
  'อยู่ตี้ใด': ['อยู่ที่ไหน', 'ที่ไหน', 'สถานที่', 'อาคาร', 'แผนผัง', 'ผัง'],
  'อยู่ตี้ไหน': ['อยู่ที่ไหน', 'ที่ไหน', 'สถานที่', 'อาคาร', 'แผนผัง'],
  'ตี้': ['ที่', 'สถานที่'],
  'ตี้ฮั่น': ['ที่นั่น', 'สถานที่'],
  'ตี้เพ้': ['ที่นี่', 'สถานที่'],
  
  // เวลา & วันที่
  'วันใด': ['วันไหน', 'กำหนดการ', 'ปฏิทิน', 'เมื่อไหร่', 'วันเปิดเรียน'],
  'เมื่อใด': ['เมื่อไหร่', 'วันไหน', 'เวลา', 'กำหนดการ'],
  'ตอนใด': ['เมื่อไหร่', 'เวลาไหน', 'กำหนดการ'],
  'เปิดเทอม': ['เปิดภาคเรียน', 'ปฏิทินการศึกษา', 'กำหนดการ', 'เปิดเรียน'],
  'ปิดเทอม': ['ปิดภาคเรียน', 'ปฏิทินการศึกษา', 'กำหนดการ'],
  
  // ค่าใช้จ่าย & การเงิน
  'เต้าใด': ['เท่าไหร่', 'กี่บาท', 'ค่าธรรมเนียม', 'ค่าเทอม', 'การเงิน', 'ค่าใช้จ่าย'],
  'เต้าได': ['เท่าไหร่', 'กี่บาท', 'ค่าใช้จ่าย', 'ค่าเทอม', 'ค่าธรรมเนียม'],
  'กี่บาท': ['เท่าไหร่', 'ค่าธรรมเนียม', 'ค่าเทอม', 'การเงิน', 'ชำระเงิน'],
  'ค่าเทอม': ['ค่าเล่าเรียน', 'ค่าธรรมเนียมการเรียน', 'การเงิน', 'ชำระเงิน', 'แผนกการเงิน', 'จ่ายเงิน'],
  
  // การกระทำ & คำถามวิธีทำ
  'ยะจะได': ['ทำอย่างไร', 'ขั้นตอน', 'ระเบียบ', 'วิธีการ', 'คำร้อง'],
  'จะได': ['อย่างไร', 'ทำอย่างไร', 'ขั้นตอน'],
  'ยะได': ['ทำอย่างไร', 'อย่างไร'],
  'ยังได': ['อย่างไร', 'ทำอย่างไร'],
  'หยั่งได': ['อย่างไร', 'ทำอย่างไร'],
  'ยะ': ['ทำ', 'ยื่น', 'ปฏิบัติ'],
  'แป๋ง': ['ทำ', 'สร้าง', 'ยื่นคำร้อง'],
  
  // บุคคล & อาจารย์
  'เปิ้น': ['ท่าน', 'ครู', 'อาจารย์', 'บุคลากร', 'ผู้สอน'],
  'อาจ๋าน': ['อาจารย์', 'ครู', 'ผู้สอน', 'บุคลากร'],
  'ไผ': ['ใคร', 'รายชื่อ', 'อาจารย์', 'ครู'],
  'ไผพ่อง': ['ใครบ้าง', 'รายชื่อครู', 'รายชื่อบุคลากร', 'อาจารย์', 'ครู'],
  'มีไผ': ['มีใคร', 'รายชื่อ', 'อาจารย์', 'ครู'],
  'มีไผพ่อง': ['มีใครบ้าง', 'รายชื่อครู', 'รายชื่อบุคลากร', 'อาจารย์', 'ครู'],
  'ไผสอน': ['ใครสอน', 'อาจารย์', 'ครู', 'ผู้สอน'],
  
  // การเรียน & กิจกรรม
  'เฮียน': ['เรียน', 'การเรียน', 'หลักสูตร', 'การสอน', 'สาขาวิชา'],
  'สมัครเฮียน': ['สมัครเรียน', 'รับสมัคร', 'นักศึกษาใหม่', 'โควตา', 'หลักสูตร'],
  'ขาดเฮียน': ['ขาดเรียน', 'การลา', 'ใบลา', 'ลาป่วย', 'คำร้อง'],
  'เข้าเฮียน': ['เข้าเรียน', 'สมัครเรียน', 'ปฏิทินการศึกษา'],
  
  // อารมณ์ & การสื่อสารท้องถิ่น & คำสร้อย/คำปฏิเสธ
  'ขะใจ๋': ['ด่วน', 'เร่งด่วน', 'ทันที'],
  'ฮู้': ['รู้', 'ทราบ'],
  'ฮู้เรื่อง': ['ทราบข้อมูล', 'รู้เรื่อง'],
  'บ่ฮู้': ['ไม่รู้', 'ไม่ทราบ'],
  'บะฮู้': ['ไม่รู้', 'ไม่ทราบ'],
  'บ่ใจ้': ['ไม่ใช่', 'ไม่ถูกต้อง'],
  'บะใจ้': ['ไม่ใช่', 'ไม่ถูกต้อง'],
  'แม่นก่อ': ['ใช่หรือไม่', 'จริงไหม'],
  'ได้ก่อ': ['ได้ไหม', 'ได้หรือไม่'],
  'ผ่อ': ['ดู', 'ตรวจสอบ', 'ตรวจ'],
  'อู้': ['พูด', 'คุย', 'ติดต่อ'],
  'แอ่ว': ['เยี่ยมชม', 'ดูงาน'],
  'ปิ๊ก': ['กลับ', 'เดินทางกลับ'],
  'อะหยัง': ['อะไร', 'ข้อมูล'],
  'อะหยังพ่อง': ['อะไรบ้าง', 'ข้อมูล', 'รายละเอียด'],
  'อยัง': ['อะไร', 'ข้อมูล'],
  'อยังพ่อง': ['อะไรบ้าง', 'ข้อมูล', 'รายละเอียด'],
  'จ๊าดนัก': ['มาก', 'เป็นอย่างมาก'],
  'สุมา': ['ขออภัย', 'ขอโทษ'],
  'สุมาเต๊อะ': ['ขออภัย', 'ขอโทษ'],
  'ลงทะเบียนเฮียน': ['ลงทะเบียนเรียน', 'ลงทะเบียน', 'ค่าหน่วยกิต', 'งานทะเบียน'],
  'ใบผลการเฮียน': ['ใบผลการเรียน', 'หนังสือรับรองผลการเรียน', 'ผลการเรียน', 'งานทะเบียน']
};

export const NORTHERN_MARKERS = [
  // คำสร้อย & คำลงท้าย & คำถาม
  'เจ้า', 'เจ้าา', 'เน้อเจ้า', 'เน้อเจ้าา', 'กะเจ้า', 'เจ้าข้า', 'เน้อ', 'หนา', 'เน้อครับ', 'กั๊บ', 'พ่อง', 'เหย', 'แล',
  'แม่นก่อ', 'ได้ก่อ', 'ดีก่อ', 'ก่อเจ้า', 'ก๋า', 'กาเจ้า',
  
  // สถานที่ & การถามทาง
  'ตี้ไหน', 'ตี้ใด', 'อยู่ตี้ใด', 'อยู่ตี้ไหน', 'ตี้', 'จ่ายตี้', 'ตี้ฮั่น', 'ตี้เพ้', 'ฮั่น',
  
  // เวลา & วันที่
  'วันใด', 'เมื่อใด', 'ตอนใด', 'เวลาใด',
  
  // ค่าใช้จ่าย & การเงิน
  'เต้าใด', 'เต้าได', 'กี่บาท', 'กี่บาทเจ้า', 'เต้าใดเจ้า',
  
  // คำถาม & การกระทำ
  'ยะจะได', 'ยะได', 'จะได', 'ยังได', 'หยั่งได', 'แป๋ง',
  
  // บุคคล & อาจารย์ (แม้ไม่มีคำว่าเจ้า)
  'เปิ้น', 'อาจ๋าน', 'ไผ', 'ไผพ่อง', 'มีไผ', 'มีไผพ่อง', 'ไผสอน', 'ข้าเจ้า', 'สู', 'ตั๋ว',
  
  // ปฏิเสธ & รับรู้
  'บ่มี', 'บะมี', 'บ่ได้', 'บะได้', 'บ่ฮู้', 'บะฮู้', 'บ่ใจ้', 'บะใจ้', 'บ่', 'บะ',
  
  // กริยา & คำเมืองทั่วไป
  'ฮู้', 'ฮู้เรื่อง', 'ผ่อ', 'อู้', 'แอ่ว', 'ปิ๊ก', 'ฮับ', 'ฮอด', 'ตึง', 'สุมา', 'สุมาเต๊อะ',
  'ยินดี', 'จ๊าดนัก', 'แต๊', 'แต้', 'ขนาด', 'แม่น', 'แม่นแล้ว',
  'อะหยัง', 'อะหยังพ่อง', 'อยัง', 'อยังพ่อง', 'เฮียน', 'สมัครเฮียน', 'ขาดเฮียน', 'เข้าเฮียน', 'ขะใจ๋'
];

export function detectNorthernDialect(text: string): boolean {
  if (!text) return false;
  const lower = text.toLowerCase();
  return NORTHERN_MARKERS.some(marker => lower.includes(marker));
}

const THAI_SYNONYMS: Record<string, string[]> = {
  'ลงทะเบียน': ['ลงทะเบียนเรียน', 'ค่าหน่วยกิต', 'งานทะเบียน', 'ขั้นตอนการลงทะเบียน', 'การลงทะเบียน'],
  'ลงทะเบียนเรียน': ['ลงทะเบียน', 'ค่าหน่วยกิต', 'งานทะเบียน', 'ขั้นตอนการลงทะเบียนเรียน'],
  'ทะเบียน': ['งานทะเบียน', 'ลงทะเบียน', 'เอกสารงานทะเบียน', 'ใบรับรอง', 'ฝ่ายทะเบียน'],
  'ค่าเทอม': ['ค่าหน่วยกิต', 'ลงทะเบียนเรียน', 'การเงิน', 'ค่าธรรมเนียมการเรียน'],
  'ผลการเรียน': ['ใบผลการเรียน', 'หนังสือรับรองผลการเรียน', 'เกรด', 'ใบ รบ', 'ปพ.', 'งานทะเบียน'],
  'ใบผลการเรียน': ['ผลการเรียน', 'หนังสือรับรองผลการเรียน', 'งานทะเบียน', 'ขอผลการเรียน', 'ขอหนังสือรับรอง'],
  'หนังสือรับรอง': ['หนังสือรับรองความประพฤติและผลการเรียน', 'ผลการเรียน', 'ใบรับรอง', 'งานทะเบียน'],
  'เนคไท': ['การแต่งกาย', 'เครื่องแต่งกาย', 'เครื่องแบบ', 'เนคไทสีกรมท่า', 'ระเบียบวินัย', 'ปวส', 'ปวช'],
  'แต่งกาย': ['เครื่องแต่งกาย', 'เครื่องแบบ', 'ทรงผม', 'ระเบียบการแต่งกาย', 'เนคไท', 'กางเกง', 'กระโปรง', 'เสื้อ'],
  'ทรงผม': ['การแต่งกาย', 'ระเบียบวินัย', 'ผม', 'ตัดผม', 'รองทรง'],
  'เครื่องแบบ': ['การแต่งกาย', 'เครื่องแต่งกาย', 'เสื้อ', 'กางเกง', 'เนคไท'],
  'เบอร์โทร': ['โทรศัพท์', 'ติดต่อ', 'ช่องทางติดต่อ', 'เบอร์โทรศัพท์', 'โทร'],
  'โทรศัพท์': ['เบอร์โทร', 'ติดต่อ', 'ช่องทางติดต่อ', 'โทร'],
  'ติดต่อ': ['ช่องทางติดต่อ', 'โทรศัพท์', 'เบอร์โทร', 'ที่อยู่', 'ติดต่อเรา'],
  'แผนผัง': ['ผัง', 'แผนที่', 'ผังวิทยาลัย', 'อาคาร', 'สถานที่', 'ที่ตั้ง'],
  'แผนที่': ['แผนผัง', 'ผัง', 'อาคาร', 'ที่ตั้ง', 'แผนผังวิทยาลัย'],
  'ผัง': ['แผนผัง', 'แผนที่', 'ผังวิทยาลัย', 'อาคาร', 'สถานที่'],
  'ผู้บริหาร': ['ผู้อำนวยการ', 'รองผู้อำนวยการ', 'คณะผู้บริหาร', 'ผอ'],
  'ผอ': ['ผู้อำนวยการ', 'ผู้บริหาร', 'คณะผู้บริหาร'],
  'อาจารย์': ['ครู', 'บุคลากร', 'ผู้สอน', 'สาขาวิชา'],
  'ครู': ['อาจารย์', 'บุคลากร', 'ผู้สอน', 'สาขาวิชา'],
  'สมัครเรียน': ['รับสมัคร', 'สมัคร', 'นักศึกษาใหม่', 'โควตา', 'หลักสูตร', 'ปวช', 'ปวส'],
  'รับสมัคร': ['สมัครเรียน', 'สมัคร', 'โควตา', 'นักศึกษาใหม่'],
  'สมัคร': ['รับสมัคร', 'สมัครเรียน', 'เข้าเรียน', 'คัดเลือก', 'โควตา'],
  'ลาป่วย': ['การลา', 'ใบลา', 'แบบฟอร์มการลา', 'คำร้อง'],
  'พ้นสภาพ': ['หมดสภาพ', 'พ้นสภาพนักเรียน', 'พ้นสภาพนักศึกษา', 'ลาออก', 'ถูกให้ออก'],
  'ก่อตั้ง': ['ประวัติ', 'ข้อมูลทั่วไป', 'จัดตั้ง', 'วันสถาปนา', 'ความเป็นมา', 'เปิดทำการ'],
  'ประวัติ': ['ก่อตั้ง', 'ความเป็นมา', 'ข้อมูลทั่วไป', 'จัดตั้ง'],
  'คะแนนความประพฤติ': ['ความประพฤติ', 'ตัดคะแนน', 'ลงโทษ', 'ระเบียบวินัย', 'มาสาย', 'คะแนน'],
  'ตัดคะแนน': ['คะแนนความประพฤติ', 'ความประพฤติ', 'ลงโทษ', 'มาสาย'],
  'มาสาย': ['ตัดคะแนน', 'คะแนนความประพฤติ', 'ระเบียบวินัย', 'ลงโทษ', 'ความประพฤติ'],
  'ลงโทษ': ['ทำทัณฑ์บน', 'ตัดคะแนน', 'ตักเตือน', 'อุทธรณ์', 'ระเบียบวินัย', 'บทลงโทษ'],
  'อุทธรณ์': ['ลงโทษ', 'คำสั่งลงโทษ', 'ระเบียบ', 'สิทธิอุทธรณ์'],
  'ประชาสัมพันธ์': ['ห้องประชาสัมพันธ์', 'ตึกอำนวยการ', 'อาคาร', 'แผนผัง'],
  'ช่างยนต์': ['เครื่องกล', 'เทคนิคเครื่องกล', 'ช่างยนต์', 'ตัวถังและสี'],
  'ช่างไฟ': ['ช่างไฟฟ้า', 'ไฟฟ้ากำลัง', 'ไฟฟ้า'],
  'คอม': ['เทคโนโลยีธุรกิจดิจิทัล', 'เครือข่ายคอมพิวเตอร์', 'ช่างเทคนิคคอมพิวเตอร์', 'ดิจิทัล']
};

export interface AcademicBranchEntity {
  id: string;
  name: string;
  aliases: string[];
  kmId?: string;
}

export const ACADEMIC_BRANCHES: AcademicBranchEntity[] = [
  {
    id: 'construction',
    name: 'ช่างก่อสร้าง',
    aliases: ['ช่างก่อสร้าง', 'ก่อสร้าง', 'แผนกก่อสร้าง', 'สาขาก่อสร้าง', 'สาขาวิชาช่างก่อสร้าง', 'ครูก่อสร้าง', 'ครูช่างก่อสร้าง'],
    kmId: 'km-0014'
  },
  {
    id: 'welding',
    name: 'ช่างเชื่อมโลหะ',
    aliases: ['ช่างเชื่อมโลหะ', 'ช่างเชื่อม', 'เชื่อมโลหะ', 'แผนกเชื่อม', 'สาขาช่างเชื่อม', 'ครูช่างเชื่อม', 'ครูเชื่อม'],
    kmId: 'km-0015'
  },
  {
    id: 'maintenance',
    name: 'ช่างซ่อมบำรุง',
    aliases: ['ช่างซ่อมบำรุง', 'ซ่อมบำรุง', 'แผนกซ่อมบำรุง', 'สาขาช่างซ่อมบำรุง', 'ครูซ่อมบำรุง'],
    kmId: 'km-0016'
  },
  {
    id: 'computer-tech',
    name: 'ช่างเทคนิคคอมพิวเตอร์',
    aliases: ['ช่างเทคนิคคอมพิวเตอร์', 'เทคนิคคอมพิวเตอร์', 'เทคนิคคอม', 'ช่างเทคนิคคอม', 'ครูเทคนิคคอม'],
    kmId: 'km-0017'
  },
  {
    id: 'electrical',
    name: 'ช่างไฟฟ้า',
    aliases: ['ช่างไฟฟ้า', 'ช่างไฟฟ้ากำลัง', 'ไฟฟ้ากำลัง', 'ไฟฟ้า', 'แผนกช่างไฟฟ้า', 'แผนกไฟฟ้า', 'ครูช่างไฟฟ้า', 'ครูไฟฟ้า'],
    kmId: 'km-0018'
  },
  {
    id: 'mechanical',
    name: 'เทคนิคเครื่องกล',
    aliases: ['เทคนิคเครื่องกล', 'ช่างยนต์', 'เครื่องกล', 'แผนกช่างยนต์', 'สาขาช่างยนต์', 'ครูช่างยนต์', 'ครูเครื่องกล'],
    kmId: 'km-0019'
  },
  {
    id: 'automotive-body',
    name: 'เทคโนโลยีอุตสาหกรรมตัวถังและสีรถยนต์',
    aliases: ['ตัวถังและสีรถยนต์', 'ตัวถังและสี', 'สีรถยนต์', 'ช่างสีรถยนต์', 'ตัวถังรถยนต์'],
    kmId: 'km-0020'
  },
  {
    id: 'accounting',
    name: 'การบัญชี',
    aliases: ['การบัญชี', 'บัญชี', 'แผนกบัญชี', 'สาขาการบัญชี', 'ครูบัญชี'],
    kmId: 'km-0021'
  },
  {
    id: 'petroleum',
    name: 'เทคโนโลยีเครื่องมือวัดและควบคุมปิโตรเลียม',
    aliases: ['เครื่องมือวัดและควบคุมปิโตรเลียม', 'ปิโตรเลียม', 'เครื่องมือวัด', 'ช่างปิโตรเลียม'],
    kmId: 'km-0022'
  },
  {
    id: 'general-studies',
    name: 'สามัญสัมพันธ์',
    aliases: ['สามัญสัมพันธ์', 'หมวดสามัญ', 'แผนกสามัญ', 'วิชาสามัญ', 'ครูสามัญ'],
    kmId: 'km-0023'
  },
  {
    id: 'digital-business',
    name: 'เทคโนโลยีธุรกิจดิจิทัล',
    aliases: ['เทคโนโลยีธุรกิจดิจิทัล', 'ธุรกิจดิจิทัล', 'คอมพิวเตอร์ธุรกิจ', 'คอมธุรกิจ', 'ดิจิทัล', 'ครูคอม'],
    kmId: 'km-0010'
  },
  {
    id: 'marketing',
    name: 'การตลาด',
    aliases: ['การตลาด', 'แผนกการตลาด', 'สาขาการตลาด', 'ครูการตลาด'],
    kmId: 'km-0011'
  },
  {
    id: 'hospitality',
    name: 'การโรงแรม',
    aliases: ['การโรงแรม', 'โรงแรม', 'แผนกการโรงแรม', 'สาขาการโรงแรม', 'ครูการโรงแรม'],
    kmId: 'km-0012'
  },
  {
    id: 'network-security',
    name: 'เครือข่ายคอมพิวเตอร์และความปลอดภัย',
    aliases: ['เครือข่ายคอมพิวเตอร์และความปลอดภัย', 'เครือข่ายคอมพิวเตอร์', 'เครือข่าย', 'cyber security', 'network security', 'network', 'ครูเครือข่าย'],
    kmId: 'km-0013'
  },
  {
    id: 'executives',
    name: 'คณะผู้บริหารวิทยาลัยการอาชีพฝาง',
    aliases: ['คณะผู้บริหาร', 'ผู้บริหาร', 'ผู้อำนวยการ', 'รองผู้อำนวยการ', 'ผอ', 'รองผอ'],
    kmId: 'km-0009'
  },
  {
    id: 'discipline',
    name: 'ระเบียบวินัยและการแต่งกาย',
    aliases: ['ระเบียบวินัย', 'การแต่งกาย', 'เครื่องแต่งกาย', 'เครื่องแบบ', 'ทรงผม', 'เนคไท', 'กางเกง', 'กระโปรง', 'ตัดคะแนน', 'ลงโทษ', 'คะแนนความประพฤติ', 'มาสาย'],
    kmId: 'km-0007'
  },
  {
    id: 'contact',
    name: 'ช่องทางติดต่อวิทยาลัยการอาชีพฝาง',
    aliases: ['ช่องทางติดต่อ', 'เบอร์โทร', 'เบอร์โทรศัพท์', 'โทรศัพท์', 'ติดต่อ', 'ที่อยู่', 'อีเมล', 'ติดต่อเรา', 'เบอร์ติดต่อ'],
    kmId: 'km-0008'
  },
  {
    id: 'org-structure',
    name: 'โครงสร้างการบริหารวิทยาลัยการอาชีพฝาง',
    aliases: ['โครงสร้างการบริหาร', 'โครงสร้างองค์กร', 'ผังการบริหาร', 'โครงสร้างวิทยาลัย'],
    kmId: 'km-0024'
  },
  {
    id: 'campus-map',
    name: 'แผนผังวิทยาลัยการอาชีพฝาง',
    aliases: ['แผนผังวิทยาลัย', 'แผนผัง', 'ผังวิทยาลัย', 'แผนที่', 'ผัง', 'อาคาร', 'สถานที่'],
    kmId: 'km-0003'
  }
];

export interface QueryIntentAnalysis {
  cleanLow: string;
  isTeacherQuery: boolean;
  isRuleQuery: boolean;
  isContactQuery: boolean;
  isMapQuery: boolean;
  matchedBranches: AcademicBranchEntity[];
  personName: string | null;
  rawTokens: string[];
}

export function analyzeQueryIntent(text: string): QueryIntentAnalysis {
  const clean = text.trim();
  const cleanLow = clean.toLowerCase();

  // 1. Intent Detection
  const isTeacherQuery = /ครู|อาจารย์|บุคลากร|ผู้สอน|หัวหน้าสาขา|หัวหน้าสาขาวิชา|ผู้ช่วยหัวหน้า|ใครสอน|มีใครบ้าง|รายชื่อ|ชื่อครู|บุคลากรประจำ|ไผ|ไผพ่อง|มีไผ|มีไผพ่อง|ไผสอน|เปิ้น|อาจ๋าน/i.test(cleanLow);
  const isRuleQuery = /แต่งกาย|ทรงผม|เนคไท|ตัดคะแนน|ลงโทษ|ทัณฑ์บน|ระเบียบ|เครื่องแบบ/i.test(cleanLow);
  const isContactQuery = /เบอร์โทร|โทรศัพท์|ติดต่อ|ติดต่อใคร|โทรหา|อู้กับไผ/i.test(cleanLow);
  const isMapQuery = /แผนผัง|ผัง|อาคาร|ห้อง|ตึก|แผนที่|ตี้ไหน|อยู่ตี้ใด/i.test(cleanLow);

  // 2. Branch Matching
  const matchedBranches = ACADEMIC_BRANCHES.filter(b => 
    b.aliases.some(alias => cleanLow.includes(alias.toLowerCase()))
  );

  // 3. Person Name Extraction (only if teacher/person related query)
  let personName: string | null = null;
  if (isTeacherQuery || /^(ใครเป็น|ว่าที่ร้อยตรีหญิง|ว่าที่ ร\.ต\. หญิง|ว่าที่ ร\.ต\.หญิง|ว่าที่ร้อยตรี|ว่าที่ ร\.ต\.|นางสาว|นาย|นาง|ครู|อาจารย์)\s*/i.test(clean)) {
    const strippedPerson = clean
      .replace(/^(ใครเป็น|ว่าที่ร้อยตรีหญิง|ว่าที่ ร\.ต\. หญิง|ว่าที่ ร\.ต\.หญิง|ว่าที่ร้อยตรี|ว่าที่ ร\.ต\.|นางสาว|นาย|นาง|ครู|อาจารย์)\s*/i, '')
      .replace(/(อยู่สาขาอะไร|อยู่แผนกไหน|คือใคร|มีใครบ้าง|เบอร์โทรอะไร|สอนอะไร|ทำหน้าที่อะไร|อยู่ไหน|เป็นครูอะไร|อยู่ตี้ไหน|อยู่ตี้ใด|มีไผพ่อง|มีไผ|คือไผ|สอนอะหยัง)$/i, '')
      .trim();
    if (strippedPerson.length >= 3 && strippedPerson.length <= 40) {
      personName = strippedPerson.toLowerCase();
    }
  }

  // 4. Substantive tokens
  const rawTokens = cleanLow
    .replace(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 2 && !QUESTION_STOPWORDS.has(t));

  return {
    cleanLow,
    isTeacherQuery,
    isRuleQuery,
    isContactQuery,
    isMapQuery,
    matchedBranches,
    personName,
    rawTokens
  };
}

export function parseFaqQuestions(content?: string): string[] {
  if (!content) return [];
  const faqs: string[] = [];
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^(Q\d*[:.]|• คำถาม[:.]|คำถาม[:.])/i.test(trimmed)) {
      const q = trimmed.replace(/^(Q\d*[:.]|• คำถาม[:.]|คำถาม[:.])\s*/i, '').trim();
      if (q.length >= 4) faqs.push(q.toLowerCase());
    }
  }
  return faqs;
}

export interface FaqPair {
  question: string;
  answer: string;
}

export function parseFaqPairsFromContent(rawContent?: string): FaqPair[] {
  if (!rawContent) return [];
  const faqSection = rawContent.split(/###\s*(?:คำถามที่พบบ่อย|รายการคำถาม-คำตอบที่พบบ่อย)/i)[1] || '';
  const lines = faqSection.split('\n').map(l => l.trim()).filter(Boolean);

  const qLines: string[] = [];
  const aLines: string[] = [];
  const interleavedPairs: FaqPair[] = [];
  let curQ = '';
  let curA = '';

  let seenQCountBeforeA = 0;
  let hasSeenA = false;
  for (const line of lines) {
    if (/^(Q\d*[:.]|• คำถาม[:.]|คำถาม[:.])/i.test(line)) {
      if (!hasSeenA) seenQCountBeforeA++;
    } else if (/^(A\d*[:.]|• คำตอบ[:.]|\*\*คำตอบ:\*\*)/i.test(line)) {
      hasSeenA = true;
    }
  }

  const isGroupedFormat = seenQCountBeforeA > 1;

  if (isGroupedFormat) {
    for (const line of lines) {
      if (line.startsWith('📄') || line.startsWith('🌐') || line.startsWith('###')) break;
      if (/^(Q\d*[:.]|• คำถาม[:.]|คำถาม[:.])/i.test(line)) {
        qLines.push(line.replace(/^(Q\d*[:.]|• คำถาม[:.]|คำถาม[:.])\s*/i, '').trim());
      } else if (/^(A\d*[:.]|• คำตอบ[:.])/i.test(line)) {
        aLines.push(line.replace(/^(A\d*[:.]|• คำตอบ[:.])\s*/i, '').trim());
      } else if (/^(\*\*คำตอบ:\*\*|คำตอบ:)/i.test(line)) {
        // Header
      } else if (aLines.length > 0) {
        aLines[aLines.length - 1] += ' ' + line;
      }
    }
    const count = Math.min(qLines.length, aLines.length);
    for (let i = 0; i < count; i++) {
      interleavedPairs.push({ question: qLines[i], answer: aLines[i] });
    }
    return interleavedPairs;
  }

  for (const line of lines) {
    if (line.startsWith('📄') || line.startsWith('🌐') || line.startsWith('###')) break;
    if (/^(Q\d*[:.]|• คำถาม[:.]|คำถาม[:.])/i.test(line)) {
      if (curQ && curA) {
        interleavedPairs.push({ question: curQ, answer: curA });
        curQ = '';
        curA = '';
      }
      curQ = line.replace(/^(Q\d*[:.]|• คำถาม[:.]|คำถาม[:.])\s*/i, '').trim();
    } else if (/^(A\d*[:.]|• คำตอบ[:.]|\*\*คำตอบ:\*\*|คำตอบ:)/i.test(line)) {
      const aText = line.replace(/^(A\d*[:.]|• คำตอบ[:.]|\*\*คำตอบ:\*\*|คำตอบ:)\s*/i, '').trim();
      if (curA) curA += ' ' + aText;
      else curA = aText;
    } else if (curA) {
      curA += ' ' + line;
    }
  }
  if (curQ && curA) {
    interleavedPairs.push({ question: curQ, answer: curA });
  }

  return interleavedPairs;
}

/**
 * Extract comprehensive Thai search tokens, entities, and n-grams
 */
export function extractDistinctiveKeywords(text: string): string[] {
  if (!text) return [];
  const clean = text.trim();
  const cleanLow = clean.toLowerCase().replace(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/g, ' ');
  const rawTokens = cleanLow.split(/\s+/).filter(t => t.length >= 2);
  const distinctive = new Set<string>();

  rawTokens.forEach(t => {
    if (!QUESTION_STOPWORDS.has(t)) distinctive.add(t);
  });

  // 1. Check known synonym keys
  Object.keys(THAI_SYNONYMS).forEach(k => {
    if (cleanLow.includes(k)) {
      distinctive.add(k);
      THAI_SYNONYMS[k].forEach(s => distinctive.add(s));
    }
  });

  // 1.1 Check Kham Mueang (Northern dialect) synonyms
  Object.keys(KHAM_MUEANG_DICTIONARY).forEach(k => {
    if (cleanLow.includes(k)) {
      distinctive.add(k);
      KHAM_MUEANG_DICTIONARY[k].forEach(s => distinctive.add(s));
    }
  });

  // 2. Known Academic Departments & Branches
  ACADEMIC_BRANCHES.forEach(b => {
    b.aliases.forEach(alias => {
      if (cleanLow.includes(alias.toLowerCase())) distinctive.add(alias.toLowerCase());
    });
  });

  // 3. Known Roles & Queries
  const knownRoles = [
    'หัวหน้าสาขาวิชา', 'หัวหน้าสาขา', 'ผู้ช่วยหัวหน้า', 'ผู้อำนวยการ', 'รองผู้อำนวยการ', 'ผู้ช่วยผู้อำนวยการ',
    'ครูประจำสาขาวิชา', 'ครูประจำสาขา', 'ครู', 'อาจารย์'
  ];
  knownRoles.forEach(r => {
    if (cleanLow.includes(r)) distinctive.add(r);
  });

  // 4. Extract stripped person names
  const strippedName = clean
    .replace(/^(ใครเป็น|ว่าที่ร้อยตรีหญิง|ว่าที่ ร\.ต\. หญิง|ว่าที่ ร\.ต\.หญิง|ว่าที่ร้อยตรี|ว่าที่ ร\.ต\.|นางสาว|นาย|นาง|ครู|อาจารย์)\s*/i, '')
    .replace(/(อยู่สาขาอะไร|อยู่แผนกไหน|คือใคร|มีใครบ้าง|เบอร์โทรอะไร|สอนอะไร|ทำหน้าที่อะไร|อยู่ไหน|เป็นครูอะไร)$/i, '')
    .trim();
  if (strippedName.length >= 3) {
    distinctive.add(strippedName.toLowerCase());
    strippedName.split(/\s+/).forEach(part => {
      if (part.length >= 2) distinctive.add(part.toLowerCase());
    });
  }

  // 5. Sliding-window n-grams (4 to 8 characters) for continuous Thai text
  const noSpace = cleanLow.replace(/\s+/g, '');
  for (let len = 4; len <= 8; len++) {
    for (let i = 0; i <= noSpace.length - len; i++) {
      const sub = noSpace.substring(i, i + len);
      if (!/^[0-9\s]+$/.test(sub) && !QUESTION_STOPWORDS.has(sub)) {
        distinctive.add(sub);
      }
    }
  }

  return Array.from(distinctive);
}

/**
 * Semantic & Distinctive Keyword search across knowledge_items (synced from Google Sheet / Supabase / SQLite)
 */
export async function searchKnowledgeBase(
  query: string, 
  topK: number = 5,
  options?: { includeDrafts?: boolean }
) {
  const qAnalysis = analyzeQueryIntent(query);
  const keywords = extractDistinctiveKeywords(query);

  let items: any[] = [];

  // 1. Try Supabase
  try {
    let sbQuery = supabaseAdmin
      .from('knowledge_items')
      .select(`
        knowledge_id,
        title,
        summary,
        content,
        content_type,
        tags,
        department_id,
        status,
        departments (name),
        sub_departments (name)
      `)
      .eq('ai_retrieval_enabled', 1);

    if (!options?.includeDrafts) {
      sbQuery = sbQuery.eq('status', 'published');
    } else {
      sbQuery = sbQuery.neq('status', 'archived');
    }

    const { data: sbItems, error } = await sbQuery;

    if (!error && sbItems && sbItems.length > 0) {
      items = sbItems.map(item => ({
        ...item,
        department_name: (item.departments as any)?.name || '',
        sub_department_name: (item.sub_departments as any)?.name || ''
      }));
    }
  } catch {}

  // 2. Fallback to SQLite
  if (items.length === 0) {
    try {
      const db = getDb();
      const statusCondition = options?.includeDrafts ? "k.status != 'archived'" : "k.status = 'published'";
      items = db.prepare(`
        SELECT 
          k.knowledge_id,
          k.title,
          k.summary,
          k.content,
          k.content_type,
          k.tags,
          k.department_id,
          k.status,
          d.name as department_name,
          s.name as sub_department_name
        FROM knowledge_items k
        LEFT JOIN departments d ON k.department_id = d.department_id
        LEFT JOIN sub_departments s ON k.sub_department_id = s.sub_department_id
        WHERE ${statusCondition} AND k.ai_retrieval_enabled = 1
      `).all() as any[];
    } catch {}
  }

  if (items.length === 0) return [];

  const scoredItems = items.map(item => {
    let score = 0.0;
    let confidence = 0.10;
    const titleLow = (item.title || '').toLowerCase();
    const summaryLow = (item.summary || '').toLowerCase();
    const contentLow = (item.content || '').toLowerCase();
    const tagsLow = (item.tags || '').toLowerCase();

    let faqMatch = false;
    let branchMatch = false;
    let personMatch = false;

    // A. Check FAQ questions
    const itemFaqs = parseFaqQuestions(item.content);
    for (const faq of itemFaqs) {
      if (qAnalysis.cleanLow.includes(faq) || faq.includes(qAnalysis.cleanLow)) {
        score += 250.0;
        faqMatch = true;
        break;
      }
      let wordsInFaq = 0;
      qAnalysis.rawTokens.forEach(t => { if (faq.includes(t)) wordsInFaq++; });
      if (qAnalysis.rawTokens.length > 0 && wordsInFaq / qAnalysis.rawTokens.length >= 0.75) {
        score += 200.0;
        faqMatch = true;
        break;
      }
    }

    // B. Entity & Intent Boost
    if (qAnalysis.matchedBranches.length > 0) {
      for (const branch of qAnalysis.matchedBranches) {
        if (branch.kmId && branch.kmId === item.knowledge_id) {
          score += 180.0;
          branchMatch = true;
          break;
        }
        if (titleLow.includes(branch.name.toLowerCase()) || tagsLow.includes(branch.name.toLowerCase())) {
          score += 150.0;
          branchMatch = true;
          break;
        }
      }
    }

    // C. Person Name Match
    if (qAnalysis.personName && qAnalysis.personName.length >= 3) {
      const pName = qAnalysis.personName;
      if (contentLow.includes(pName) || titleLow.includes(pName) || tagsLow.includes(pName)) {
        score += 180.0;
        personMatch = true;
      } else {
        const parts = pName.split(/\s+/).filter(p => p.length >= 3);
        if (parts.some(p => contentLow.includes(p) || tagsLow.includes(p))) {
          score += 140.0;
          personMatch = true;
        }
      }
    }

    // Direct tag match for any token or person in query
    let parsedTags: string[] = [];
    try {
      parsedTags = JSON.parse(item.tags || '[]');
    } catch {
      parsedTags = item.tags ? [item.tags] : [];
    }
    for (const tag of parsedTags) {
      const tLow = tag.toLowerCase();
      if (tLow.length >= 3 && qAnalysis.cleanLow.includes(tLow)) {
        score += 30.0;
        if (!personMatch && contentLow.includes(tLow) && item.title.includes('รายชื่อครู')) {
          personMatch = true;
        }
      }
    }

    // D. Keyword Matches across Title, Tags, Summary, Content
    let matchedTokensCount = 0;
    qAnalysis.rawTokens.forEach(tok => {
      let matchedInDoc = false;
      if (titleLow.includes(tok)) { score += 6.0; matchedInDoc = true; }
      if (tagsLow.includes(tok)) { score += 4.0; matchedInDoc = true; }
      if (summaryLow.includes(tok)) { score += 2.0; matchedInDoc = true; }
      if (contentLow.includes(tok)) { score += 1.0; matchedInDoc = true; }
      if (matchedInDoc) matchedTokensCount++;
    });

    // Also factor in distinctive keywords (synonyms, domain terms & n-grams)
    let matchedDistinctiveCount = 0;
    const meaningfulKeywords = keywords.filter(kw => kw.length >= 3 && !/^[0-9]+$/.test(kw));
    meaningfulKeywords.forEach(kw => {
      let kwMatched = false;
      if (titleLow.includes(kw)) { score += 2.5; kwMatched = true; }
      if (tagsLow.includes(kw)) { score += 1.5; kwMatched = true; }
      if (summaryLow.includes(kw)) { score += 0.8; kwMatched = true; }
      if (contentLow.includes(kw)) { score += 0.4; kwMatched = true; }
      if (kwMatched) matchedDistinctiveCount++;
    });

    // E. Match ratio
    const tokenOverlap = qAnalysis.rawTokens.length > 0 ? matchedTokensCount / qAnalysis.rawTokens.length : 0;
    const keywordOverlap = meaningfulKeywords.length > 0 ? matchedDistinctiveCount / meaningfulKeywords.length : 0;
    const effectiveOverlap = Math.max(tokenOverlap, keywordOverlap);

    // F. Fallback / Penalty for mismatched intent
    if (item.content_type === 'news' && (qAnalysis.isTeacherQuery || qAnalysis.isRuleQuery)) {
      score = Math.max(0, score - 60.0);
    }

    // G. Calibrated Confidence Calculation
    if (faqMatch || (branchMatch && qAnalysis.isTeacherQuery)) {
      confidence = 0.98;
    } else if (personMatch) {
      confidence = 0.96;
    } else if (branchMatch) {
      confidence = 0.92;
    } else if (score >= 60.0) {
      confidence = Math.min(0.95, 0.82 + (score / 400.0));
    } else if (score >= 30.0) {
      confidence = Math.min(0.90, 0.75 + (score / 300.0));
    } else if (score >= 15.0) {
      confidence = Math.min(0.85, 0.65 + (score / 200.0));
    } else if (score >= 8.0) {
      confidence = 0.65;
    } else if (effectiveOverlap >= 0.25 && score >= 4.0) {
      confidence = 0.60;
    } else {
      confidence = Math.min(0.40, Math.round(effectiveOverlap * 50) / 100);
    }

    return {
      knowledge_id: item.knowledge_id,
      title: item.title,
      summary: item.summary,
      content: item.content,
      content_type: item.content_type || 'document',
      department_id: item.department_id,
      department_name: item.department_name || 'วิทยาลัยการอาชีพฝาง',
      sub_department_name: item.sub_department_name || '',
      status: item.status,
      rawScore: score,
      relevance_score: Math.round(confidence * 100) / 100
    };
  });

  // Filter items with meaningful relevance and sort descending
  const filtered = scoredItems
    .filter(i => i.rawScore > 0.5)
    .sort((a, b) => b.rawScore - a.rawScore)
    .slice(0, topK);

  return filtered.map((item, idx) => ({
    ...item,
    rank: idx + 1
  }));
}

/**
 * Clean Markdown asterisks and artifacts from output text:
 * - Strip bold/italic markdown (**text**, *text*)
 * - Convert bullet asterisks (* item, - item) to clean bullets (• item)
 * - Remove stray asterisks (*) completely
 * - Remove Q/A prefix artifacts
 */
export function cleanAiMarkdownArtifacts(text: string): string {
  if (!text) return '';
  return text
    // Convert bullet asterisks & dashes (* item, - item) to clean bullet (• item)
    .replace(/^[\t ]*[*•\-][\t ]+/gm, '• ')
    // Strip bold & italics markdown markers
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    // Remove any remaining stray asterisks
    .replace(/\*/g, '')
    // Remove markdown heading marks (### Heading -> Heading)
    .replace(/^#{1,6}\s+(.+)$/gm, '$1')
    // Remove Q:/A: markers
    .replace(/^(\s*Q\d*[:.]\s*|\s*A\d*[:.]\s*|\s*คำถาม[:.]\s*|\s*คำตอบ[:.]\s*)+/gmi, '')
    .replace(/(\n|\s+)(Q\d*[:.]|A\d*[:.]|คำถาม[:.]|คำตอบ[:.])\s*/gmi, '$1')
    .replace(/\b(A|Q)\d*\s*:\s*/gi, '')
    .trim();
}

export function cleanFaqArtifacts(text: string): string {
  return cleanAiMarkdownArtifacts(text);
}

/**
 * Strict Gender Persona filter to guarantee no mixed "ครับ/ค่ะ" or wrong gender particles.
 */
export function enforceGenderPersonaInText(
  text: string,
  gender: 'male' | 'female' = 'female',
  isDialect: boolean = false
): string {
  if (!text) return '';
  let cleaned = text;

  // 1. กำจัดคำผสม เช่น ครับ/ค่ะ หรือ ค่ะ/ครับ
  cleaned = cleaned.replace(/ครับ\s*\/\s*ค่ะ/g, gender === 'male' ? 'ครับ' : 'ค่ะ');
  cleaned = cleaned.replace(/ค่ะ\s*\/\s*ครับ/g, gender === 'male' ? 'ครับ' : 'ค่ะ');
  cleaned = cleaned.replace(/ครับ\/ค่ะ/g, gender === 'male' ? 'ครับ' : 'ค่ะ');
  cleaned = cleaned.replace(/ค่ะ\/ครับ/g, gender === 'male' ? 'ครับ' : 'ค่ะ');

  if (gender === 'female') {
    // 2. ปรับสรรพนามผู้ช่วย AI จากเพศชายเป็นเพศหญิง
    cleaned = cleaned.replace(/\bผมคือหุ่นยนต์\b/g, 'หนูคือหุ่นยนต์');
    cleaned = cleaned.replace(/ผมคือผู้ช่วย/g, 'หนูคือผู้ช่วย');
    cleaned = cleaned.replace(/ผมขอแนะนำ/g, 'หนูขอแนะนำ');
    cleaned = cleaned.replace(/ผมขอ/g, 'หนูขอ');
    cleaned = cleaned.replace(/ผมช่วย/g, 'หนูช่วย');
    cleaned = cleaned.replace(/ผมยินดี/g, 'ยินดี');
    cleaned = cleaned.replace(/กับผมได้/g, 'กับหนูได้');
    cleaned = cleaned.replace(/ถามผมได้/g, 'ถามหนูได้');
    cleaned = cleaned.replace(/ถามผม/g, 'ถามหนู');

    if (isDialect) {
      // คำเมืองเพศหญิง: ใช้ เจ้า, เน้อเจ้า, ยินดีเจ้า, กะเจ้า ห้ามใช้ ครับ, เน้อครับ, นะครับ
      cleaned = cleaned.replace(/เน้อครับ/g, 'เน้อเจ้า');
      cleaned = cleaned.replace(/กะครับ/g, 'กะเจ้า');
      cleaned = cleaned.replace(/ยินดีครับ/g, 'ยินดีเจ้า');
      cleaned = cleaned.replace(/ขอบคุณครับ/g, 'ขอบคุณเจ้า');
      cleaned = cleaned.replace(/สุมาเต๊อะครับ/g, 'สุมาเต๊อะเจ้า');
      cleaned = cleaned.replace(/นะครับ/g, 'เน้อเจ้า');
      cleaned = cleaned.replace(/นะคับ/g, 'เน้อเจ้า');
      cleaned = cleaned.replace(/ครับผม/g, 'เจ้า');
      cleaned = cleaned.replace(/ครับ/g, 'เจ้า');
      cleaned = cleaned.replace(/คับ(?=[ \n.,!?•]|$)/g, 'เจ้า');
    } else {
      // ภาษากลางเพศหญิง: ใช้ ค่ะ, คะ, นะคะ ห้ามใช้ ครับ, นะครับ, คับ
      // ประโยคคำถามที่ลงท้ายด้วย ครับ -> คะ (เช่น มีอะไรให้ช่วยไหมครับ -> มีอะไรให้ช่วยไหมคะ)
      cleaned = cleaned.replace(/(ไหม|มั้ย|หรือยัง|รึยัง|ได้ไหม|ได้มั้ย|อย่างไร|ยังไง|หรือเปล่า|รึเปล่า)\s*ครับ/g, '$1คะ');
      cleaned = cleaned.replace(/(ไหม|มั้ย|หรือยัง|รึยัง|ได้ไหม|ได้มั้ย|อย่างไร|ยังไง|หรือเปล่า|รึเปล่า)\s*นะครับ/g, '$1นะคะ');
      cleaned = cleaned.replace(/นะครับ/g, 'นะคะ');
      cleaned = cleaned.replace(/นะคับ/g, 'นะคะ');
      cleaned = cleaned.replace(/ครับผม/g, 'ค่ะ');
      cleaned = cleaned.replace(/ยินดีครับ/g, 'ยินดีค่ะ');
      cleaned = cleaned.replace(/ขอบคุณครับ/g, 'ขอบคุณค่ะ');
      cleaned = cleaned.replace(/สวัสดีครับ/g, 'สวัสดีค่ะ');
      cleaned = cleaned.replace(/เน้อครับ/g, 'นะคะ');
      cleaned = cleaned.replace(/เน้อเจ้า/g, 'นะคะ');
      cleaned = cleaned.replace(/เจ้า(?=[ \n.,!?•]|$)/g, 'ค่ะ');
      cleaned = cleaned.replace(/ครับ/g, 'ค่ะ');
      cleaned = cleaned.replace(/คับ(?=[ \n.,!?•]|$)/g, 'ค่ะ');
    }
  } else {
    // เพศชาย: ใช้ ครับ, นะครับ, เน้อครับ ห้ามใช้ ค่ะ, คะ, นะคะ, เจ้า
    if (isDialect) {
      cleaned = cleaned.replace(/เน้อเจ้า/g, 'เน้อครับ');
      cleaned = cleaned.replace(/กะเจ้า/g, 'กะครับ');
      cleaned = cleaned.replace(/ยินดีเจ้า/g, 'ยินดีครับ');
      cleaned = cleaned.replace(/ขอบคุณเจ้า/g, 'ขอบคุณครับ');
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
      cleaned = cleaned.replace(/เน้อครับ/g, 'นะครับ');
      cleaned = cleaned.replace(/ยินดีเจ้า/g, 'ยินดีครับ');
      cleaned = cleaned.replace(/ขอบคุณเจ้า/g, 'ขอบคุณครับ');
      cleaned = cleaned.replace(/เจ้า(?=[ \n.,!?•]|$)/g, 'ครับ');
    }
  }

  return cleaned;
}

async function getFangLiveWeather() {
  const lat = 19.9174;
  const lon = 99.2139;
  const now = new Date();
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const thaiDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  const dateStr = `วัน${thaiDays[now.getDay()]}ที่ ${now.getDate()} ${thaiMonths[now.getMonth()]} พ.ศ. ${now.getFullYear() + 543}`;

  try {
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=Asia%2FBangkok`, {
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      const data = await res.json();
      const cur = data.current;
      const wCode = cur.weather_code;
      let desc = 'ท้องฟ้าแจ่มใส มีเมฆบางส่วน';
      if (wCode >= 51 && wCode <= 65) desc = 'มีฝนตกเล็กน้อยถึงปานกลาง';
      else if (wCode >= 80 && wCode <= 82) desc = 'มีฝนฟ้าคะนองเป็นแห่งๆ';
      else if (wCode >= 95) desc = 'มีพายุฝนฟ้าคะนอง';
      else if (wCode >= 1 && wCode <= 3) desc = 'มีเมฆเป็นส่วนมาก อากาศร่มรื่น';

      return {
        dateStr,
        temp: Math.round(cur.temperature_2m),
        feelsLike: Math.round(cur.apparent_temperature),
        humidity: cur.relative_humidity_2m,
        desc,
        windSpeed: cur.wind_speed_10m
      };
    }
  } catch (e) {}

  return {
    dateStr,
    temp: 29,
    feelsLike: 31,
    humidity: 78,
    desc: 'มีเมฆเป็นส่วนมาก และมีโอกาสเกิดฝนตกเป็นแห่งๆ',
    windSpeed: 8
  };
}

/**
 * Generate AI Answer strictly from retrieved context (Google Gemini / OpenAI / Grounded Synthesis)
 */
async function generateGroundedAnswer(
  config: AiEngineConfig,
  question: string,
  sources: any[],
  isDialectInput: boolean = false
): Promise<string> {
  const decryptedKey = decryptApiKey(config.api_key_encrypted || '');
  const primarySource = sources[0];
  const isWeatherQuery = question.includes('อากาศ') || (primarySource && (primarySource.title?.includes('อากาศ') || primarySource.content?.includes('อากาศ')));
  const isDialect = config.voice_dialect_mode === 'always_kham_mueang' || 
    (config.voice_dialect_mode !== 'always_central' && (isDialectInput || detectNorthernDialect(question)));

  let liveWeatherData: any = null;
  if (isWeatherQuery) {
    liveWeatherData = await getFangLiveWeather();
  }

  // 1. Live Google Gemini API Integration
  if (decryptedKey && decryptedKey.length > 10 && config.provider === 'gemini') {
    try {
      const contextText = sources
        .map((s, i) => {
          let text = `### [เอกสารที่ ${i + 1}] ${s.title} (ฝ่าย: ${s.department_name || 'วิทยาลัยการอาชีพฝาง'}${s.sub_department_name ? ' / ' + s.sub_department_name : ''})\n`;
          if (s.summary) text += `- สาระสำคัญ: ${s.summary}\n`;
          if (s.content) text += `- เนื้อหาเอกสาร:\n${s.content}\n`;
          return text;
        })
        .join('\n\n---\n\n');

      const weatherContext = liveWeatherData ? `\n\n[ข้อมูลสภาพอากาศจริงประจำวัน ณ อ.ฝาง จ.เชียงใหม่: ${liveWeatherData.dateStr}, อุณหภูมิ: ${liveWeatherData.temp}°C (รู้สึกเหมือน ${liveWeatherData.feelsLike}°C), สภาพอากาศ: ${liveWeatherData.desc}, ความชื้นสัมพัทธ์: ${liveWeatherData.humidity}%]` : '';

      const promptPayload = {
        systemInstruction: {
          parts: [
            {
              text: `${config.system_prompt}\n\nคำแนะนำและข้อกำหนดสำคัญสำหรับการตอบ:
1. หากคำถามถามหารายชื่อครู, อาจารย์, หัวหน้าสาขา หรือบุคลากร:
   - ให้สรุปและแสดงรายชื่อพร้อมตำแหน่งอย่างเป็นระเบียบ เช่น
     • หัวหน้าสาขาวิชา: [ชื่อ-สกุล] ([ตำแหน่ง])
     • ผู้ช่วยหัวหน้าสาขาวิชา: [ชื่อ-สกุล] ([ตำแหน่ง])
     • ครูประจำสาขาวิชา: [ชื่อ-สกุล] ([ตำแหน่ง])
   - ระบุชื่อสาขาวิชาของวิทยาลัยการอาชีพฝางให้ชัดเจน
2. หากในองค์ความรู้มีหัวข้อ 'คำถามที่พบบ่อย (FAQ)' หรือ 'รายการคำถาม-คำตอบที่พบบ่อย' ที่ตรงกับสิ่งที่ผู้ใช้ถาม ให้นำคำตอบที่ระบุในคู่นั้นมาตอบผู้ใช้โดยตรง
3. หากคำถามเกี่ยวข้องกับสภาพอากาศ ให้นำข้อมูลสภาพอากาศจริงของ อ.ฝาง จ.เชียงใหม่ มาตอบอย่างสุภาพและแม่นยำ
4. กฎสำคัญ: ห้ามแสดงตัวอักษรนำหน้า เช่น 'Q:', 'A:', 'Q1:', 'A1:', 'คำถาม:', 'คำตอบ:' ในคำตอบอย่างเด็ดขาด
5. กฎเข้มงวดป้องกันการตอบผิด (Strict Anti-Hallucination): ตอบเฉพาะข้อมูลที่มีระบุอยู่ในเอกสารอ้างอิงเท่านั้น ห้ามคาดเดาข้อมูลที่ไม่ปรากฏในเอกสาร หากไม่พบข้อมูลให้ตอบอย่างสุภาพว่ายังไม่พบข้อมูลและแนะนำช่องทางติดต่อฝ่ายงานที่เกี่ยวข้องอย่างชัดเจน
6. รูปแบบการตอบสำหรับการแปลงเป็นเสียงพูดสังเคราะห์ (Text-to-Speech & Spoken Rhythm):
   - ใช้ภาษาพูดที่นุ่มนวล เป็นมิตร สุภาพ และเป็นธรรมชาติเสมือนครูอาจารย์ที่ปรึกษาของวิทยาลัยการอาชีพฝางกำลังพูดคุยให้คำแนะนำ
   - จัดวรรคตอนของประโยคให้มีจังหวะหยุดหายใจพอเหมาะ ไม่เขียนข้อความยาวติดกันเป็นพืด
   - กฎสำคัญเรื่องเครื่องหมาย: ห้ามใช้เครื่องหมายดอกจัน (*) หรือ Markdown ตัวหนา (**...**) ในคำตอบอย่างเด็ดขาด หากเป็นรายการหัวข้อย่อยให้ใช้สัญลักษณ์จุดกลม (•) หรือขึ้นบรรทัดใหม่แทน
   - หลีกเลี่ยงการใช้อักษรย่อที่อ่านยาก และหลีกเลี่ยงสัญลักษณ์พิเศษที่ไม่จำเป็น เช่น *, #, /, |
   - เมื่อแจกแจงรายการ ให้เขียนเชื่อมด้วยภาษาพูดที่เป็นธรรมชาติ เช่น "โดยเปิดสอนในระดับ ปวช. และ ปวส. ได้แก่ สาขา..."
${isDialect
  ? (config.voice_gender === 'male'
      ? `7. กฎสำคัญบังคับตอบภาษาถิ่นเหนือ (คำเมือง) สำหรับผู้ชาย (STRICT KHAM MUEANG - MALE):
   - ผู้ใช้ถามด้วยภาษาถิ่นเหนือ/สำเนียงล้านนา ระบบต้องตอบกลับเป็น "ภาษาถิ่นเหนือ (คำเมือง)" อย่างสุภาพ นุ่มนวล สุขุม
   - ในฐานะผู้ชาย ให้ใช้คำลงท้าย "ครับ", "เน้อครับ", "ยินดีครับ" ห้ามมีคำลงท้าย "เจ้า" หรือ "ค่ะ/คะ" เด็ดขาด
   - ใช้คำศัพท์ภาษาเหนือที่ถูกต้องเป็นธรรมชาติ เช่น ตี้, เฮียน, ฮับ, ยะจะได, เต้าใด, เปิ้น, ตวย, ผ่อ, สุมาเต๊อะครับ
   - ห้ามใช้ "ครับ/ค่ะ" ปนกันเด็ดขาด
   - เนื้อหาข้อเท็จจริง กฎระเบียบ รายชื่อ และขั้นตอนของวิทยาลัยการอาชีพฝาง ต้องคงความถูกต้องแม่นยำ 100% ไม่บิดเบือน
   - เว้นวรรคจังหวะหลังคำลงท้าย "ครับ" หรือ "เน้อครับ" ให้ฟังสบายและเหมาะสำหรับการแปลงเป็นเสียงพูด (TTS)`
      : `7. กฎสำคัญบังคับตอบภาษาถิ่นเหนือ (คำเมือง) สำหรับผู้หญิง (STRICT KHAM MUEANG - FEMALE):
   - ผู้ใช้ถามด้วยภาษาถิ่นเหนือ/สำเนียงล้านนา ระบบต้องตอบกลับเป็น "ภาษาถิ่นเหนือ (คำเมือง)" อย่างไพเราะ อ่อนหวาน นุ่มนวล
   - ในฐานะผู้หญิง ให้ใช้คำลงท้าย "เจ้า", "เน้อเจ้า", "ยินดีเจ้า", "กะเจ้า" ห้ามมีคำลงท้าย "ครับ" เด็ดขาด
   - ใช้คำศัพท์ภาษาเหนือที่ถูกต้องเป็นธรรมชาติ เช่น ตี้, เฮียน, ฮับ, ยะจะได, เต้าใด, เปิ้น, ตวย, ผ่อ, สุมาเต๊อะเจ้า
   - ห้ามใช้ "ครับ/ค่ะ" ปนกันเด็ดขาด
   - เนื้อหาข้อเท็จจริง กฎระเบียบ รายชื่อ และขั้นตอนของวิทยาลัยการอาชีพฝาง ต้องคงความถูกต้องแม่นยำ 100% ไม่บิดเบือน
   - เว้นวรรคจังหวะหลังคำลงท้าย "เจ้า" หรือ "เน้อเจ้า" ให้ฟังสบายและเหมาะสำหรับการแปลงเป็นเสียงพูด (TTS)`)
  : (config.voice_gender === 'male'
      ? `7. กฎบุคลิกภาพเพศชาย (Male Persona):
   - ตอบเป็นข้อความบรรยายภาษาไทยกลางที่สุภาพ สุขุม นอบน้อม ถูกต้อง ชัดเจน น้ำเสียงน่าเชื่อถือ
   - ให้ใช้คำลงท้ายเพศชาย "ครับ", "นะครับ" เท่านั้น ห้ามใช้ "ค่ะ", "คะ", "นะคะ" หรือ "ครับ/ค่ะ" อย่างเด็ดขาด`
      : `7. กฎบุคลิกภาพเพศหญิง (Female Persona):
   - ตอบเป็นข้อความบรรยายภาษาไทยกลางที่สุภาพ อ่อนหวาน นอบน้อม ถูกต้อง ชัดเจน น้ำเสียงเป็นมิตร
   - ให้ใช้คำลงท้ายเพศหญิง "ค่ะ", "คะ", "นะคะ" เท่านั้น ห้ามใช้ "ครับ", "นะครับ" หรือ "ครับ/ค่ะ" อย่างเด็ดขาด`)}`
            }
          ]
        },
        contents: [
          {
            role: 'user',
            parts: [
              { text: `## องค์ความรู้อ้างอิงจากฐานข้อมูลวิทยาลัยการอาชีพฝาง:\n${contextText}${weatherContext}\n\n## คำถามของผู้ใช้:\n${question}` }
            ]
          }
        ],
        generationConfig: {
          temperature: config.temperature,
          maxOutputTokens: 1024
        }
      };

      // Map official Google Gemini models resiliently (prioritizing active models with available quota)
      const primaryModel = config.model_name || 'gemini-3.1-flash-lite';
      const candidateModels = Array.from(new Set([
        primaryModel,
        'gemini-3.1-flash-lite',
        'gemini-3.5-flash-lite',
        'gemini-flash-lite-latest',
        'gemini-3.8-flash',
        'gemini-3.6-flash',
        'gemini-flash-latest'
      ])).filter(Boolean);

      for (const modelId of candidateModels) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${decryptedKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(promptPayload),
            signal: AbortSignal.timeout(6000)
          });

          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text && text.trim().length > 0) return cleanFaqArtifacts(text.trim());
          } else if (res.status === 404 || res.status === 503 || res.status === 429) {
            continue;
          } else {
            const errText = await res.text();
            console.warn(`Gemini API (${modelId}) returned ${res.status}:`, errText);
            continue;
          }
        } catch (callErr) {
          continue;
        }
      }
    } catch (err) {
      console.warn('Live Gemini API call error:', err);
    }
  }

  // 2. Live OpenAI API Integration
  if (decryptedKey && decryptedKey.startsWith('sk-') && config.provider === 'openai') {
    try {
      const contextText = sources
        .map((s, i) => `[เอกสารที่ ${i + 1}: ${s.title} (${s.department_name})]\n${s.summary || ''}\n${s.content || ''}`)
        .join('\n\n---\n\n');

      const weatherContext = liveWeatherData ? `\n\n[ข้อมูลสภาพอากาศจริง ณ อ.ฝาง จ.เชียงใหม่: ${liveWeatherData.dateStr}, อุณหภูมิ: ${liveWeatherData.temp}°C, สภาพอากาศ: ${liveWeatherData.desc}]` : '';

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${decryptedKey}`
        },
        body: JSON.stringify({
          model: config.model_name || 'gpt-4o-mini',
          temperature: config.temperature,
          messages: [
            {
              role: 'system',
              content: `${config.system_prompt}\n\nคำแนะนำและข้อกำหนดสำคัญสำหรับการตอบ:\n1. หากในองค์ความรู้มีหัวข้อ 'รายการคำถาม-คำตอบที่พบบ่อย (FAQ Pairs)' ที่ตรงกับสิ่งที่ผู้ใช้ถาม ให้นำคำตอบที่ระบุในคู่นั้นมาตอบผู้ใช้โดยตรง\n2. หากคำถามเกี่ยวข้องกับสภาพอากาศ ให้นำข้อมูลสภาพอากาศจริงของ อ.ฝาง จ.เชียงใหม่ มาตอบอย่างสุภาพและแม่นยำ\n3. กฎสำคัญ: ห้ามแสดงตัวอักษรนำหน้า เช่น 'Q:', 'A:', 'Q1:', 'A1:', 'คำถาม:', 'คำตอบ:' ในคำตอบอย่างเด็ดขาด\n4. กฎเข้มงวดเรื่องเครื่องหมาย: ห้ามใช้เครื่องหมายดอกจัน (*) หรือ Markdown ตัวหนา (**...**) ในคำตอบอย่างเด็ดขาด ให้ใช้สัญลักษณ์จุดกลม (•) หรือข้อความธรรมดาแทน\n5. กฎเข้มงวดป้องกันการตอบผิด (Strict Anti-Hallucination): ตอบเฉพาะข้อมูลที่มีระบุอยู่ในเอกสารอ้างอิงเท่านั้น ห้ามคาดเดาข้อมูลที่ไม่ปรากฏในเอกสาร หากไม่พบข้อมูลให้ตอบอย่างสุภาพว่ายังไม่พบข้อมูลและแนะนำช่องทางติดต่อฝ่ายงานที่เกี่ยวข้องอย่างชัดเจน\n6. ${isDialect
                ? (config.voice_gender === 'male'
                    ? 'ผู้ใช้ถามภาษาถิ่นเหนือ ตอบกลับเป็นภาษาถิ่นเหนือ (คำเมือง) สำหรับผู้ชาย สุภาพ สุขุม ใช้คำลงท้าย "ครับ", "เน้อครับ" ห้ามใช้ "เจ้า" หรือ "ค่ะ/คะ" เด็ดขาด และใช้คำศัพท์คำเมือง เช่น ตี้, เฮียน, ฮับ, ยะจะได, เปิ้น'
                    : 'ผู้ใช้ถามภาษาถิ่นเหนือ ตอบกลับเป็นภาษาถิ่นเหนือ (คำเมือง) สำหรับผู้หญิง สุภาพ อ่อนหวาน ใช้คำลงท้าย "เจ้า", "เน้อเจ้า" ห้ามใช้ "ครับ" หรือ "ค่ะ/คะ" เด็ดขาด และใช้คำศัพท์คำเมือง เช่น ตี้, เฮียน, ฮับ, ยะจะได, เปิ้น')
                : (config.voice_gender === 'male'
                    ? 'ตอบเป็นข้อความบรรยายภาษาไทยที่สุภาพ นอบน้อม ถูกต้อง และกระชับตรงประเด็น โดยใช้คำลงท้ายเพศชาย "ครับ", "นะครับ" เท่านั้น ห้ามใช้ "ค่ะ", "คะ" หรือ "ครับ/ค่ะ" เด็ดขาด'
                    : 'ตอบเป็นข้อความบรรยายภาษาไทยที่สุภาพ นอบน้อม ถูกต้อง และกระชับตรงประเด็น โดยใช้คำลงท้ายเพศหญิง "ค่ะ", "คะ", "นะคะ" เท่านั้น ห้ามใช้ "ครับ" หรือ "ครับ/ค่ะ" เด็ดขาด')}`
            },
            {
              role: 'user',
              content: `## องค์ความรู้อ้างอิง:\n${contextText}${weatherContext}\n\n## คำถามของผู้ใช้:\n${question}`
            }
          ]
        })
      });

      if (res.ok) {
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content;
        if (text && text.trim().length > 0) return cleanFaqArtifacts(text.trim());
      }
    } catch (err) {
      console.warn('OpenAI API call error:', err);
    }
  }

  // 3. Grounded Synthesis Engine (Local synthesis strictly grounded on retrieved sources)
  let answerBody = '';

  if (isWeatherQuery && liveWeatherData) {
    const isMale = config.voice_gender === 'male';
    const polite = isDialect ? (isMale ? 'เน้อครับ' : 'เน้อเจ้า') : (isMale ? 'ครับ' : 'ค่ะ');
    answerBody = `🌤️ สภาพอากาศจริง อ.ฝาง จ.เชียงใหม่ (${liveWeatherData.dateStr}):\n• อุณหภูมิ: ${liveWeatherData.temp}°C (รู้สึกเหมือน ${liveWeatherData.feelsLike}°C)\n• สภาพอากาศ: ${liveWeatherData.desc}\n• ความชื้นสัมพัทธ์: ${liveWeatherData.humidity}%\n• คำแนะนำ: สภาพอากาศเหมาะสำหรับการเดินทาง แต่อาจมีฝนตกโปรยปราย แนะนำให้พกร่มเมื่อเดินทางมายังวิทยาลัยการอาชีพฝาง${polite} 🎓`;
    return cleanAiMarkdownArtifacts(answerBody);
  }

  const keywords = extractDistinctiveKeywords(question);
  const qAnalysis = analyzeQueryIntent(question);
  let relevantSnippet = '';

  // Check if primarySource has FAQ pairs matching the question (both formats: FAQ table / QA list)
  let bestFaqAnswer = '';
  if (primarySource.content) {
    const faqPairs = parseFaqPairsFromContent(primarySource.content);
    let maxScore = 0;
    for (const pair of faqPairs) {
      let matchScore = 0;
      const qLow = pair.question.toLowerCase();
      const aLow = pair.answer.toLowerCase();

      keywords.forEach(kw => {
        if (kw.length >= 2) {
          if (qLow.includes(kw)) matchScore += 4;
          if (aLow.includes(kw)) matchScore += 2;
        }
      });

      if (qAnalysis.cleanLow.includes(qLow) || qLow.includes(qAnalysis.cleanLow)) {
        matchScore += 15;
      }

      if (matchScore > maxScore && pair.answer) {
        maxScore = matchScore;
        bestFaqAnswer = cleanFaqArtifacts(pair.answer);
      }
    }
  }

  // Check if primarySource is a Teacher/Personnel list and user asked about teachers
  if ((qAnalysis.isTeacherQuery || primarySource.title?.includes('รายชื่อครู')) && primarySource.content) {
    const mainBody = primarySource.content.split(/###\s*คำถามที่พบบ่อย/i)[0] || primarySource.content;
    const lines = mainBody.split('\n').map((l: string) => l.trim()).filter(Boolean);
    const formattedRoster: string[] = [];
    let currentRole = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^(หัวหน้าสาขาวิชา|ผู้ช่วยหัวหน้าสาขาวิชา|ครูประจำสาขาวิชา|คณะผู้บริหาร|ผู้อำนวยการ|รองผู้อำนวยการ)$/i.test(line)) {
        currentRole = line;
      } else if (currentRole && (line.includes('—') || line.includes('-') || line.startsWith('นาย') || line.startsWith('นาง') || line.startsWith('ว่าที่'))) {
        formattedRoster.push(`• ${currentRole}: ${line}`);
      }
    }

    if (formattedRoster.length > 0) {
      const isMale = config.voice_gender === 'male';
      const introParticle = isDialect
        ? (isMale ? 'มีจิ่มนี้เน้อครับ:' : 'มีจิ่มนี้เน้อเจ้า:')
        : (isMale ? 'มีดังนี้ครับ:' : 'มีดังนี้ค่ะ:');
      answerBody = `${primarySource.title} วิทยาลัยการอาชีพฝาง ${introParticle}\n\n` + formattedRoster.join('\n');
    }
  }

  if (bestFaqAnswer && bestFaqAnswer.length > 5 && !answerBody) {
    answerBody = bestFaqAnswer;
  } else if (!answerBody) {
    if (primarySource.content) {
      const lines = primarySource.content.split('\n').map((l: string) => l.trim()).filter(Boolean);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (keywords.some(kw => line.toLowerCase().includes(kw) && kw.length >= 3)) {
          let heading = '';
          for (let j = i - 1; j >= Math.max(0, i - 6); j--) {
            if (/^(การแต่งกาย|ระเบียบ|หลักเกณฑ์|การลงโทษ|###)/i.test(lines[j])) {
              heading = lines[j].replace(/^[#*`\s]+/, '') + ': ';
              break;
            }
          }
          const start = Math.max(0, i - 1);
          const end = Math.min(lines.length, i + 5);
          relevantSnippet = (heading ? `${heading}\n` : '') + lines.slice(start, end).join('\n');
          break;
        }
      }
    }

    if (relevantSnippet && relevantSnippet.length > 20) {
      answerBody = cleanFaqArtifacts(relevantSnippet.replace(/[#*`]/g, ''));
    } else if (primarySource.summary && primarySource.summary.length > 20 && !primarySource.summary.startsWith('A:')) {
      answerBody = cleanFaqArtifacts(primarySource.summary);
    } else if (primarySource.content) {
      const mainContent = primarySource.content.split(/###\s*(?:คำถามที่พบบ่อย|รายการคำถาม)/i)[0] || primarySource.content;
      answerBody = cleanFaqArtifacts(mainContent.substring(0, 450).replace(/[#*`]/g, ''));
    }
  }

  const deptContact = primarySource.sub_department_name || primarySource.department_name || 'งานบริหารงานทั่วไป';
  const cleanBody = answerBody.replace(/^ตามข้อมูลจาก.*:\s*/i, '').trim();
  const isMale = config.voice_gender === 'male';
  let closing = '';
  if (isDialect) {
    closing = isMale
      ? `\n\nหากต้องการสอบถามข้อมูลเพิ่มเติม สามารถติดต่อได้ตี้${deptContact}เน้อครับ`
      : `\n\nหากต้องการสอบถามข้อมูลเพิ่มเติม สามารถติดต่อได้ตี้${deptContact}เน้อเจ้า`;
  } else {
    closing = isMale
      ? `\n\nหากท่านต้องการสอบถามข้อมูลเพิ่มเติม สามารถติดต่อได้ที่${deptContact}ครับ`
      : `\n\nหากท่านต้องการสอบถามข้อมูลเพิ่มเติม สามารถติดต่อได้ที่${deptContact}นะคะ`;
  }

  return cleanAiMarkdownArtifacts(`${cleanBody}${closing}`);
}

/**
 * Detect Conversational & Small Talk Intents (Greetings, Thank You, System Status)
 */
export function detectConversationalIntent(
  text: string, 
  isDialectInput: boolean = false,
  voiceGender: 'female' | 'male' = 'female'
): { isConversational: boolean; replyText?: string } {
  const clean = (text || '').toLowerCase().replace(/[\s\t\n!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/g, '');
  const isMale = voiceGender === 'male';
  
  // 1. Greetings (สวัสดี, สวัสดีเจ้า, ฮัลโหล, ดีครับ, hello, hi)
  const greetings = ['สวัสดี', 'สวัสดีครับ', 'สวัสดีค่ะ', 'สวัสดีคีับ', 'สวัสดีคะ', 'สวัสดีคับ', 'สวัสดีจ้า', 'สวัสดีเจ้า', 'หวัดดี', 'หวัดดีครับ', 'หวัดดีค่ะ', 'หวัดดีเจ้า', 'ดีครับ', 'ดีค่ะ', 'ดีเจ้า', 'ฮัลโหล', 'hello', 'hi', 'hey', 'sawasdee'];
  if (greetings.includes(clean) || (clean.startsWith('สวัสดี') && clean.length <= 15) || (clean.startsWith('หวัดดี') && clean.length <= 12)) {
    const isNorthernGreet = isDialectInput || clean.includes('เจ้า') || clean.includes('เน้อ');
    if (isNorthernGreet) {
      return {
        isConversational: true,
        replyText: isMale
          ? 'สวัสดีครับ ยินดีต้อนรับสู่ระบบ AI วิทยาลัยการอาชีพฝาง 🎓\n\nสามารถสอบถามข้อมูลการเรียน, ระเบียบการสมัคร หรือติดต่อฝ่ายงานตี้ต้องการได้เลยเน้อครับ'
          : 'สวัสดีเจ้า ยินดีต้อนรับสู่ระบบ AI วิทยาลัยการอาชีพฝาง 🎓\n\nสามารถสอบถามข้อมูลการเรียน, ระเบียบการสมัคร หรือติดต่อฝ่ายงานตี้ต้องการได้เลยเน้อเจ้า'
      };
    } else {
      return {
        isConversational: true,
        replyText: isMale
          ? 'สวัสดีครับ ยินดีต้อนรับสู่ระบบ AI วิทยาลัยการอาชีพฝาง 🎓\n\nท่านสามารถพิมพ์คำถามหรือเรื่องที่ต้องการสอบถามได้ทันทีครับ เช่น:\n• ระเบียบวินัย / การแต่งกายและทรงผม\n• รายชื่อสาขาวิชาและหลักสูตรที่เปิดสอน\n• ช่องทางติดต่อฝ่ายงานและแผนกต่างๆ'
          : 'สวัสดีค่ะ ยินดีต้อนรับสู่ระบบ AI วิทยาลัยการอาชีพฝาง 🎓\n\nท่านสามารถพิมพ์คำถามหรือเรื่องที่ต้องการสอบถามได้ทันทีค่ะ เช่น:\n• ระเบียบวินัย / การแต่งกายและทรงผม\n• รายชื่อสาขาวิชาและหลักสูตรที่เปิดสอน\n• ช่องทางติดต่อฝ่ายงานและแผนกต่างๆ'
      };
    }
  }

  // 2. Thank you
  const thanks = ['ขอบคุณ', 'ขอบคุณครับ', 'ขอบคุณค่ะ', 'ขอบคุณคะ', 'ขอบคุณคับ', 'ขอบคุณเจ้า', 'ขอบใจ', 'ขอบใจเน้อ', 'ขอบใจจ้า', 'ขอบพระคุณ', 'thanks', 'thankyou', 'thx'];
  if (thanks.includes(clean) || (clean.startsWith('ขอบคุณ') && clean.length <= 15)) {
    const isNorthernThanks = isDialectInput || clean.includes('เจ้า') || clean.includes('เน้อ');
    if (isNorthernThanks) {
      return {
        isConversational: true,
        replyText: isMale
          ? 'ยินดีนักๆ ครับ ยินดีตี้ได้จ้วยเหลือ หากมีข้อสงสัยสอบถามเพิ่มเติมได้ตลอดเวลาเน้อครับ 🎓'
          : 'ยินดีนักๆ เจ้า ยินดีตี้ได้จ้วยเหลือ หากมีข้อสงสัยสอบถามเพิ่มเติมได้ตลอดเวลาเน้อเจ้า 🎓'
      };
    } else {
      return {
        isConversational: true,
        replyText: isMale
          ? 'ยินดีให้บริการครับ หากมีข้อสงสัยหรือต้องการสอบถามข้อมูลเพิ่มเติม สามารถพิมพ์ถามได้ตลอดเวลานะครับ 😊'
          : 'ยินดีให้บริการค่ะ หากมีข้อสงสัยหรือต้องการสอบถามข้อมูลเพิ่มเติม สามารถพิมพ์ถามได้ตลอดเวลานะคะ 😊'
      };
    }
  }

  // 3. Test
  const tests = ['test', 'ทดสอบ', 'เทส', 'เทสระบบ', 'testระบบ'];
  if (tests.includes(clean)) {
    return {
      isConversational: true,
      replyText: isMale
        ? 'ระบบ AI วิทยาลัยการอาชีพฝาง พร้อมให้บริการตามปกติครับ 🟢 ท่านสามารถพิมพ์คำถามเพื่อค้นหาข้อมูลได้ทันทีนะครับ'
        : 'ระบบ AI วิทยาลัยการอาชีพฝาง พร้อมให้บริการตามปกติค่ะ 🟢 ท่านสามารถพิมพ์คำถามเพื่อค้นหาข้อมูลได้ทันทีนะคะ'
    };
  }

  return { isConversational: false };
}

/**
 * Transcribe and extract intent from voice audio buffer using Google Gemini Multimodal
 */
export async function transcribeAndProcessAudio(
  audioBuffer: Buffer,
  mimeType: string = 'audio/m4a'
): Promise<{
  transcription: string;
  question: string;
  isKhamMueang: boolean;
}> {
  const config = getActiveAiConfig();
  const decryptedKey = decryptApiKey(config.api_key_encrypted || '');

  if (!decryptedKey || decryptedKey.length < 10) {
    return {
      transcription: '',
      question: '',
      isKhamMueang: false
    };
  }

  try {
    // Normalize audio MIME type for Gemini API compatibility (e.g. LINE audio/x-m4a -> audio/m4a)
    let cleanMime = (mimeType || 'audio/m4a').toLowerCase().trim();
    if (cleanMime === 'audio/x-m4a' || cleanMime.includes('m4a')) {
      cleanMime = 'audio/m4a';
    } else if (cleanMime.includes('mp4')) {
      cleanMime = 'audio/mp4';
    } else if (cleanMime.includes('mpeg') || cleanMime.includes('mp3')) {
      cleanMime = 'audio/mp3';
    } else if (cleanMime.includes('wav')) {
      cleanMime = 'audio/wav';
    } else if (cleanMime.includes('ogg')) {
      cleanMime = 'audio/ogg';
    } else if (cleanMime.includes('aac')) {
      cleanMime = 'audio/aac';
    } else {
      cleanMime = 'audio/m4a';
    }

    const base64Audio = audioBuffer.toString('base64');
    const promptPayload = {
      systemInstruction: {
        parts: [
          {
            text: `คุณคือระบบผู้เชี่ยวชาญด้านการฟัง ถอดเสียง และทำความเข้าใจภาษาถิ่นเหนือ (คำเมือง) รวมถึงสำเนียงคำเมืองและภาษาไทยกลาง ประจำวิทยาลัยการอาชีพฝาง
หน้าที่ของคุณคือรับฟังคลิปเสียงนี้อย่างละเอียดและแม่นยำสูงสุด:
1. ถอดเสียงพูด (transcription): ถอดเสียงภาษาไทย/คำเมืองของผู้พูดเป็นตัวอักษรไทยอย่างถูกต้องตรงตามที่พูดทุกคำ โดยเว้นวรรคประโยคและจังหวะคำให้ตรงตามความหมายและจังหวะการพูดจริง เพื่อให้อ่านเข้าใจง่ายและเป็นธรรมชาติ
2. สกัดคำถามและเจตนา (question): ทำความเข้าใจเจตนาของผู้พูดอย่างลึกซึ้ง แปลงคำเมืองหรือสำเนียงภาษาเหนือให้เป็นประโยคคำถามภาษาไทยมาตรฐานที่ชัดเจน รัดกุม เพื่อนำไปสืบค้นฐานข้อมูลองค์ความรู้ได้อย่างแม่นยำ
3. ตรวจจับภาษาถิ่น/สำเนียงเหนือ (is_kham_mueang):
   - ระบุเป็น true หากผู้พูดใช้ภาษาถิ่นเหนือ (คำเมือง), มีคำศัพท์ภาษาเหนือ, หรือพูดภาษาไทยด้วย "สำเนียงเหนือ" (เช่น คำเมืองไม่มีคำสร้อย, คำเมืองที่ไม่มีคำว่า "เจ้า", คำถามแบบกันเอง เช่น มีไผพ่อง, กี่บาท, ตี้ไหน, ยะจะได, วันใด, เปิดเทอมวันใด, อะหยัง, แป๋ง, บ่, ฮู้, ก่อ ฯลฯ)
   - หากมีคำว่า "เจ้า" หรือคำสร้อย (เน้อ, กะเจ้า, เจ้าข้า) ยิ่งชัดเจนว่าเป็น true
   - ระบุเป็น false เฉพาะเมื่อเป็นภาษาไทยกลางมาตรฐานที่ไม่มีสำเนียงหรือคำศัพท์ภาษาเหนือเลยเท่านั้น

ตอบกลับเป็น JSON บริสุทธิ์ในรูปแบบ:
{"transcription": "...", "question": "...", "is_kham_mueang": true/false}`
          }
        ]
      },
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: cleanMime,
                data: base64Audio
              }
            },
            {
              text: 'กรุณาถอดเสียงและสกัดคำถามจากคลิปเสียงนี้'
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
        responseMimeType: 'application/json'
      }
    };

    const candidateModels = Array.from(new Set([
      config.model_name || 'gemini-3.1-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash-lite',
      'gemini-flash-lite-latest',
      'gemini-3.8-flash',
      'gemini-3.6-flash',
      'gemini-flash-latest'
    ])).filter(Boolean);

    for (const modelId of candidateModels) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${decryptedKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(promptPayload),
          signal: AbortSignal.timeout(12000)
        });

        if (res.ok) {
          const data = await res.json();
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const cleanText = text.replace(/^```(json)?\s*/i, '').replace(/\s*```$/i, '').trim();
            const parsed = JSON.parse(cleanText);
            return {
              transcription: parsed.transcription || '',
              question: parsed.question || parsed.transcription || '',
              isKhamMueang: Boolean(parsed.is_kham_mueang) || detectNorthernDialect(parsed.transcription || '')
            };
          }
        }
      } catch (err) {
        continue;
      }
    }
  } catch (err) {
    console.error('transcribeAndProcessAudio error:', err);
  }

  return {
    transcription: '',
    question: '',
    isKhamMueang: false
  };
}

/**
 * Execute Full RAG Pipeline with Voice & Kham Mueang Support
 */
export async function executeRAGPipeline(params: {
  question?: string;
  audioBuffer?: Buffer;
  audioMimeType?: string;
  lineUserId?: string;
  isPlayground?: boolean;
  includeDrafts?: boolean;
  publicBaseUrl?: string;
  generateVoiceReply?: boolean;
  overrideVoiceGender?: 'male' | 'female';
}): Promise<RAGExecutionResult> {
  const startTime = Date.now();
  const db = getDb();
  const baseConfig = getActiveAiConfig();
  const config = {
    ...baseConfig,
    voice_gender: params.overrideVoiceGender || baseConfig.voice_gender || 'female'
  };
  const { lineUserId = 'LINE_ANONYMOUS_USER', isPlayground = false, includeDrafts = false, publicBaseUrl = '', generateVoiceReply } = params;
  const isAudioInput = Boolean(params.audioBuffer && params.audioBuffer.length > 0);
  const shouldProduceVoice = generateVoiceReply !== undefined ? generateVoiceReply : (isPlayground ? Boolean(config.voice_reply_enabled) : isAudioInput);

  let question = (params.question || '').trim();
  let transcribedQuestion: string | undefined;
  let isAudioKhamMueang = false;

  // If audio buffer is provided, transcribe with Gemini Multimodal
  if (params.audioBuffer && params.audioBuffer.length > 0) {
    const audioRes = await transcribeAndProcessAudio(params.audioBuffer, params.audioMimeType);
    if (audioRes.transcription) {
      transcribedQuestion = audioRes.transcription;
      question = audioRes.question || audioRes.transcription;
      isAudioKhamMueang = audioRes.isKhamMueang;
    }
  }

  // Fallback if no question text could be determined
  if (!question) {
    const isMale = config.voice_gender === 'male';
    const polite = isMale ? 'ครับ' : 'ค่ะ';
    const defaultMsg = `ขออภัย${polite} ระบบไม่สามารถจับใจความเสียงได้ชัดเจน กรุณาลองพูดใหม่อีกครั้ง หรือพิมพ์ข้อความคำถามได้เลย${polite}`;
    return {
      question: '',
      answer: defaultMsg,
      confidence_score: 0.0,
      is_fallback: true,
      response_time_ms: Date.now() - startTime,
      voiceGender: config.voice_gender,
      sources: []
    };
  }

  const isDialect = config.voice_dialect_mode === 'always_kham_mueang' || 
    (config.voice_dialect_mode !== 'always_central' && (
      detectNorthernDialect(question) || 
      detectNorthernDialect(transcribedQuestion || '') || 
      isAudioKhamMueang
    ));

  // 0. Handle Conversational Greetings & Courtesy Messages
  const convIntent = detectConversationalIntent(question, isDialect, config.voice_gender);
  if (convIntent.isConversational && convIntent.replyText) {
    const responseTimeMs = Date.now() - startTime;
    let logId: string | undefined;
    if (!isPlayground) {
      logId = 'qlog-' + crypto.randomUUID();
      try {
        await supabaseAdmin.from('ai_query_logs').insert({
          log_id: logId,
          line_user_id: lineUserId,
          question_text: question.trim(),
          confidence_score: 1.0,
          answer_text: convIntent.replyText,
          is_fallback: 0,
          response_time_ms: responseTimeMs,
          feedback: 'none'
        });
      } catch {}

      try {
        db.prepare(`
          INSERT INTO ai_query_logs (
            log_id, line_user_id, matched_user_id, question_text, confidence_score,
            answer_text, is_fallback, response_time_ms, feedback, department_id, created_at
          ) VALUES (?, ?, NULL, ?, 1.0, ?, 0, ?, 'none', NULL, datetime('now', 'localtime'))
        `).run(logId, lineUserId, question.trim(), convIntent.replyText, responseTimeMs);
      } catch {}
    }

    let greetingAudioUrl: string | undefined;
    let greetingDurationMs: number | undefined;

    if (shouldProduceVoice && config.voice_reply_enabled) {
      try {
        const audioRes = await generateAudioReply({
          text: convIntent.replyText,
          voiceGender: config.voice_gender,
          speed: config.voice_speed,
          publicBaseUrl,
          dialect: isDialect ? 'kham_mueang' : 'central'
        });
        if (audioRes.success) {
          greetingAudioUrl = audioRes.audioUrl;
          greetingDurationMs = audioRes.durationMs;
        }
      } catch {}
    }

    return {
      log_id: logId,
      question,
      answer: convIntent.replyText,
      confidence_score: 1.0,
      is_fallback: false,
      response_time_ms: responseTimeMs,
      audioUrl: greetingAudioUrl,
      audioDurationMs: greetingDurationMs,
      detectedDialect: isDialect ? 'kham_mueang' : 'central',
      transcribedQuestion,
      voiceGender: config.voice_gender,
      sources: []
    };
  }

  // 1. Search knowledge base with smart entity & intent scoring
  const retrievedSources = await searchKnowledgeBase(
    question, 
    config.retrieval_top_k, 
    { includeDrafts: isPlayground ? includeDrafts : false }
  );

  const topScore = retrievedSources.length > 0 ? retrievedSources[0].relevance_score : 0.0;
  const isFallback = topScore < config.confidence_threshold || retrievedSources.length === 0;

  let answerText = '';
  let responseTimeMs = 0;

  if (isFallback) {
    const isMale = config.voice_gender === 'male';
    if (isDialect) {
      answerText = isMale
        ? 'สุมาเต๊อะครับ ขณะนี้ยังบ่ปะข้อมูลตี้ระบุในคำถามอย่างชัดเจนในระบบฐานความรู้ของวิทยาลัยการอาชีพฝางเน้อครับ\n\n📌 แนะนำช่องทางติดต่อสอบถามเพิ่มเติมครับ:\n• ฝ่ายบริหารทรัพยากร / งานธุรการ: 053-451234\n• งานศูนย์ข้อมูลสารสนเทศและดิจิทัล / งานทะเบียน: อาคาร 1\n• สอบถามเจ้าหน้าที่ผู้ดูแลระบบโดยตรงผ่าน LINE Official Account ในวันและเวลาราชการครับ'
        : 'สุมาเต๊อะเจ้า ขณะนี้ยังบ่ปะข้อมูลตี้ระบุในคำถามอย่างชัดเจนในระบบฐานความรู้ของวิทยาลัยการอาชีพฝางเน้อเจ้า\n\n📌 แนะนำช่องทางติดต่อสอบถามเพิ่มเติมเจ้า:\n• ฝ่ายบริหารทรัพยากร / งานธุรการ: 053-451234\n• งานศูนย์ข้อมูลสารสนเทศและดิจิทัล / งานทะเบียน: อาคาร 1\n• สอบถามเจ้าหน้าที่ผู้ดูแลระบบโดยตรงผ่าน LINE Official Account ในวันและเวลาราชการเจ้า';
    } else {
      answerText = isMale
        ? 'ขออภัยครับ ขณะนี้ยังไม่พบข้อมูลที่ระบุในคำถามอย่างชัดเจนในระบบฐานความรู้ของวิทยาลัยการอาชีพฝางครับ\n\n📌 แนะนำช่องทางติดต่อสอบถามเพิ่มเติมครับ:\n• ฝ่ายบริหารทรัพยากร / งานธุรการ: 053-451234\n• งานศูนย์ข้อมูลสารสนเทศและดิจิทัล / งานทะเบียน: อาคาร 1\n• สอบถามเจ้าหน้าที่ผู้ดูแลระบบโดยตรงผ่าน LINE Official Account ในวันและเวลาราชการครับ'
        : 'ขออภัยค่ะ ขณะนี้ยังไม่พบข้อมูลที่ระบุในคำถามอย่างชัดเจนในระบบฐานความรู้ของวิทยาลัยการอาชีพฝางค่ะ\n\n📌 แนะนำช่องทางติดต่อสอบถามเพิ่มเติมค่ะ:\n• ฝ่ายบริหารทรัพยากร / งานธุรการ: 053-451234\n• งานศูนย์ข้อมูลสารสนเทศและดิจิทัล / งานทะเบียน: อาคาร 1\n• สอบถามเจ้าหน้าที่ผู้ดูแลระบบโดยตรงผ่าน LINE Official Account ในวันและเวลาราชการค่ะ';
    }

    // Auto-record to knowledge_gap_logs if not playground
    if (!isPlayground) {
      try {
        const gapId = 'gap-' + crypto.randomUUID();
        const existingGap = db.prepare('SELECT gap_id, ask_count FROM knowledge_gap_logs WHERE question_text = ? LIMIT 1').get(question.trim()) as any;
        if (existingGap) {
          try {
            await supabaseAdmin.from('knowledge_gap_logs').update({
              ask_count: (existingGap.ask_count || 1) + 1,
              last_asked_at: new Date().toISOString()
            }).eq('question_text', question.trim());
          } catch {}
          db.prepare(`UPDATE knowledge_gap_logs SET ask_count = ask_count + 1, last_asked_at = datetime('now', 'localtime') WHERE gap_id = ?`).run(existingGap.gap_id);
        } else {
          try {
            await supabaseAdmin.from('knowledge_gap_logs').insert({
              gap_id: gapId,
              question_text: question.trim(),
              ask_count: 1,
              status: 'open',
              department_guess: retrievedSources[0]?.department_id || null
            });
          } catch {}
          db.prepare(`
            INSERT INTO knowledge_gap_logs (gap_id, question_text, ask_count, status, department_guess, last_asked_at)
            VALUES (?, ?, 1, 'open', ?, datetime('now', 'localtime'))
          `).run(gapId, question.trim(), retrievedSources[0]?.department_id || null);
        }
      } catch (err) {
        console.error('Failed to log knowledge gap:', err);
      }
    }
  } else {
    answerText = await generateGroundedAnswer(config, question, retrievedSources, isDialect);
  }

  // Enforce consistent gender persona and clean markdown asterisks
  answerText = enforceGenderPersonaInText(answerText, config.voice_gender, isDialect);
  answerText = cleanAiMarkdownArtifacts(answerText);

  responseTimeMs = Date.now() - startTime;

  // Resolve Drive Media / Teacher Photo & Document / PDF Attachment if applicable
  const mediaInfo = !isFallback ? await resolveDriveImageForQuery(question, answerText, retrievedSources) : null;
  const docAttachment = !isFallback ? await resolveDocumentAttachmentForQuery(question, retrievedSources) : null;

  // If live query (not playground), persist to ai_query_logs & ai_retrieved_sources
  let logId: string | undefined;
  if (!isPlayground) {
    logId = 'qlog-' + crypto.randomUUID();
    const matchedUser = db.prepare('SELECT user_id, department_id FROM master_users WHERE line_user_id = ? LIMIT 1').get(lineUserId) as any;

    // 1. Supabase
    try {
      await supabaseAdmin.from('ai_query_logs').insert({
        log_id: logId,
        line_user_id: lineUserId,
        matched_user_id: matchedUser?.user_id || null,
        question_text: question.trim(),
        confidence_score: topScore,
        answer_text: answerText,
        is_fallback: isFallback ? 1 : 0,
        response_time_ms: responseTimeMs,
        feedback: 'none',
        department_id: retrievedSources[0]?.department_id || matchedUser?.department_id || null
      });

      if (retrievedSources.length > 0) {
        const sbSources = retrievedSources.map(s => ({
          source_id: 'asrc-' + crypto.randomUUID(),
          log_id: logId,
          knowledge_id: s.knowledge_id,
          relevance_score: s.relevance_score,
          rank: s.rank
        }));
        await supabaseAdmin.from('ai_retrieved_sources').insert(sbSources);
      }
    } catch (sbErr) {
      console.warn('Supabase RAG query log warning:', sbErr);
    }

    // 2. SQLite
    try {
      db.prepare(`
        INSERT INTO ai_query_logs (
          log_id, line_user_id, matched_user_id, question_text, confidence_score,
          answer_text, is_fallback, response_time_ms, feedback, department_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'none', ?, datetime('now', 'localtime'))
      `).run(
        logId,
        lineUserId,
        matchedUser?.user_id || null,
        question.trim(),
        topScore,
        answerText,
        isFallback ? 1 : 0,
        responseTimeMs,
        retrievedSources[0]?.department_id || matchedUser?.department_id || null
      );

      const insertSource = db.prepare(`
        INSERT INTO ai_retrieved_sources (source_id, log_id, knowledge_id, relevance_score, rank)
        VALUES (?, ?, ?, ?, ?)
      `);

      retrievedSources.forEach(s => {
        insertSource.run('asrc-' + crypto.randomUUID(), logId, s.knowledge_id, s.relevance_score, s.rank);
      });
    } catch {}
  }

  let audioUrl: string | undefined;
  let audioDurationMs: number | undefined;

  if (shouldProduceVoice && config.voice_reply_enabled && answerText) {
    try {
      const audioRes = await generateAudioReply({
        text: answerText,
        voiceGender: config.voice_gender,
        speed: config.voice_speed,
        publicBaseUrl,
        dialect: isDialect ? 'kham_mueang' : 'central'
      });
      if (audioRes.success) {
        audioUrl = audioRes.audioUrl;
        audioDurationMs = audioRes.durationMs;
      }
    } catch (audioErr) {
      console.warn('Audio generation warning:', audioErr);
    }
  }

  return {
    log_id: logId,
    question,
    answer: answerText,
    confidence_score: topScore,
    is_fallback: isFallback,
    response_time_ms: responseTimeMs,
    imageUrl: mediaInfo?.imageUrl,
    imageCaption: mediaInfo?.caption,
    isWebAttachment: mediaInfo?.isWebAttachment,
    matchedTeachers: mediaInfo?.matchedTeachers,
    documentAttachment: docAttachment || undefined,
    audioUrl,
    audioDurationMs,
    detectedDialect: isDialect ? 'kham_mueang' : 'central',
    transcribedQuestion,
    voiceGender: config.voice_gender,
    sources: retrievedSources.map(s => ({
      knowledge_id: s.knowledge_id,
      title: s.title,
      content_type: s.content_type,
      department_name: s.department_name,
      relevance_score: s.relevance_score,
      rank: s.rank
    }))
  };
}

/**
 * Resolve Image matching retrieved knowledge items or Google Drive
 * Priority 1: Web-uploaded images from knowledge_attachments for retrieved knowledge sources
 * Priority 2: Google Drive media cache (drive_media_cache) or Drive links in content
 */
export async function resolveDriveImageForQuery(
  question: string,
  answerText: string,
  sources: any[]
): Promise<{ imageUrl?: string; caption?: string; isWebAttachment?: boolean; matchedTeachers?: TeacherMediaInfo[] } | null> {
  const db = getDb();
  const primarySource = sources[0];
  const combinedText = `${question} ${answerText} ${primarySource?.title || ''}`.toLowerCase();
  const qLower = question.toLowerCase();

  // Check if user is asking about student uniforms, dress code, or attire
  const isUniformQuery = /แต่งกาย|ชุดนักเรียน|ชุดนักศึกษา|เครื่องแบบ|เนคไท|ชุดฝึกงาน|ชุดปฏิบัติงาน|ชุดพิธีการ|ชุดอวท|ชุด อวท|อวท|ยูนิฟอร์ม|uniform|ทรงผม/i.test(question) ||
                         /แต่งกาย|ชุดนักเรียน|ชุดนักศึกษา|เครื่องแบบ|ชุดอวท/i.test(primarySource?.title || '');
  const isUniformAttachment = (nameOrTitle: string) => {
    return /ชุดนร|ชุดนักเรียน|ชุดนักศึกษา|ชุดอวท/i.test(nameOrTitle || '');
  };

  // 1. PRIORITY 1: Check Web-uploaded Attachments (knowledge_attachments) for retrieved knowledge sources
  if (sources && sources.length > 0) {
    try {
      const knowledgeIds = sources.map(s => s.knowledge_id).filter(Boolean);
      if (knowledgeIds.length > 0) {
        // First check SQLite knowledge_attachments
        const placeholders = knowledgeIds.map(() => '?').join(',');
        const webAttachments = db.prepare(`
          SELECT * FROM knowledge_attachments 
          WHERE knowledge_id IN (${placeholders})
          ORDER BY uploaded_at DESC
        `).all(...knowledgeIds) as any[];

        const validFilter = (att: any) => {
          if (!att.file_url) return false;
          if (att.file_url.includes('sample_')) return false;
          if (att.file_url.includes('drive.google.com/drive/folders')) return false;
          if (att.file_url.includes('docs.google.com')) return false;
          const isImgType = att.file_type === 'image';
          const isImgExt = /\.(jpg|jpeg|png|webp|gif|bmp)(\?.*)?$/i.test(att.file_name || '') ||
                           /\.(jpg|jpeg|png|webp|gif|bmp)(\?.*)?$/i.test(att.file_url);
          return isImgType || isImgExt;
        };

        const pickBestImg = (atts: any[]) => {
          const valid = atts.filter(validFilter);
          if (valid.length === 0) return null;

          // If the attachment is a student uniform picture,
          // ONLY allow it if the user is genuinely asking about dress code / attire / uniforms!
          const candidates = isUniformQuery 
            ? valid 
            : valid.filter(att => !isUniformAttachment(att.file_name));

          if (candidates.length === 0) return null;

          if (isUniformQuery) {
            const qHasPws = qLower.includes('ปวส') || qLower.includes('ประกาศนียบัตรวิชาชีพชั้นสูง');
            const qHasPwc = (qLower.includes('ปวช') || qLower.includes('ประกาศนียบัตรวิชาชีพ')) && !qHasPws;
            const qHasAvt = qLower.includes('อวท');

            if (qHasAvt) {
              if (qHasPws) {
                const avtPws = candidates.find(att => (att.file_name || '').toLowerCase().includes('ชุดอวท.ปวส'));
                if (avtPws) return avtPws;
              }
              const avtGen = candidates.find(att => {
                const fn = (att.file_name || '').toLowerCase();
                return fn.includes('ชุดอวท') && !fn.includes('ปวส');
              }) || candidates.find(att => (att.file_name || '').toLowerCase().includes('ชุดอวท'));
              if (avtGen) return avtGen;
            }

            if (qHasPwc) {
              const pwcMatch = candidates.find(att => {
                const fn = (att.file_name || '').toLowerCase();
                return fn.includes('ปวช') && !fn.includes('ปวส');
              });
              if (pwcMatch) return pwcMatch;
            }

            if (qHasPws) {
              const pwsMatch = candidates.find(att => {
                const fn = (att.file_name || '').toLowerCase();
                return fn.includes('ปวส');
              });
              if (pwsMatch) return pwsMatch;
            }

            // Answer intent if question didn't specify level
            const ansLower = answerText.toLowerCase();
            const ansHasPws = ansLower.includes('ปวส');
            const ansHasPwc = ansLower.includes('ปวช') && !ansHasPws;

            if (ansHasPwc) {
              const pwcMatch = candidates.find(att => {
                const fn = (att.file_name || '').toLowerCase();
                return fn.includes('ปวช') && !fn.includes('ปวส');
              });
              if (pwcMatch) return pwcMatch;
            }

            if (ansHasPws) {
              const pwsMatch = candidates.find(att => {
                const fn = (att.file_name || '').toLowerCase();
                return fn.includes('ปวส');
              });
              if (pwsMatch) return pwsMatch;
            }

            // Fallback for uniform query: return best matching uniform candidate
            const anyUniform = candidates.find(att => (att.file_name || '').includes('ชุดนร.ปวส')) ||
                               candidates.find(att => isUniformAttachment(att.file_name));
            if (anyUniform) return anyUniform;
          }

          // Return candidate matching primary source if available, or first valid non-uniform candidate
          const primaryMatch = candidates.find(att => att.knowledge_id === primarySource?.knowledge_id);
          return primaryMatch || candidates[0];
        };

        let foundWebImg = pickBestImg(webAttachments);

        // If not found in SQLite, check Supabase
        if (!foundWebImg) {
          try {
            const { data: sbAtts } = await supabaseAdmin
              .from('knowledge_attachments')
              .select('*')
              .in('knowledge_id', knowledgeIds)
              .order('uploaded_at', { ascending: false });

            if (sbAtts && sbAtts.length > 0) {
              foundWebImg = pickBestImg(sbAtts);
            }
          } catch {}
        }

        if (foundWebImg) {
          let finalWebImgUrl = foundWebImg.file_url;
          const dMatch = finalWebImgUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
          if (dMatch && dMatch[1]) {
            finalWebImgUrl = `https://lh3.googleusercontent.com/d/${dMatch[1]}`;
          }

          const matchedSource = sources.find(s => s.knowledge_id === foundWebImg.knowledge_id);
          return {
            imageUrl: finalWebImgUrl,
            caption: foundWebImg.file_name || matchedSource?.title || 'ภาพประกอบ',
            isWebAttachment: true
          };
        }
      }
    } catch (attErr) {
      console.warn('Error checking web attachments in RAG:', attErr);
    }
  }

  // 2. PRIORITY 2: Check Google Drive media cache (drive_media_cache)
  try {
    const cachedMedia = (db.prepare('SELECT * FROM drive_media_cache ORDER BY updated_at DESC').all() as any[])
      .filter(m => m.file_id && m.file_id.length <= 35 && !m.title_or_person_name?.startsWith('KB-'));
    const normalizedCombined = combinedText.replace(/ศุทธิชัย/g, 'ศุทิชัย').replace(/ปิงใจ/g, 'ปิ่นใจ');
    
    // First pass: match teachers / personnel (collect all matches if multiple teachers exist)
    const matchedTeachers: TeacherMediaInfo[] = [];
    const textWithoutCollege = normalizedCombined.replace(/วิทยาลัย/g, '');

    for (const m of cachedMedia) {
      if (isUniformAttachment(m.title_or_person_name)) continue;

      const rawPersonName = (m.title_or_person_name.split('(')[0] || '')
        .replace(/\.(jpg|jpeg|png|webp|gif|bmp)$/i, '')
        .trim()
        .toLowerCase();
      const normPersonName = rawPersonName.replace(/ศุทธิชัย/g, 'ศุทิชัย').replace(/ปิงใจ/g, 'ปิ่นใจ');
      const cleanPersonName = normPersonName
        .replace(/^(ใครเป็น|ว่าที่ร้อยตรีหญิง|ว่าที่ ร\.ต\. หญิง|ว่าที่ ร\.ต\.หญิง|ว่าที่ร้อยตรี|ว่าที่ ร\.ต\.|นางสาว|นาย|นาง|ครู|อาจารย์|ดร\.|ผศ\.)\s*/i, '')
        .trim();

      // Skip mock/dummy seeded file IDs ending in _01, _02 if it's a dummy ID
      if (m.file_id && m.file_id.match(/_[0-9]{2,}$/)) continue;

      const tokens = cleanPersonName.split(/[\s,]+/).filter((tok: string) => tok.length >= 3);
      if (tokens.length === 0) continue;

      const firstName = tokens[0];
      const lastName = tokens.length > 1 && tokens[1] !== tokens[0] ? tokens[1] : null;

      let isMatch = false;
      if (normalizedCombined.includes(rawPersonName) || normalizedCombined.includes(normPersonName) || (cleanPersonName.length >= 4 && normalizedCombined.includes(cleanPersonName))) {
        isMatch = true;
      } else if (lastName && textWithoutCollege.includes(firstName) && textWithoutCollege.includes(lastName)) {
        isMatch = true;
      } else if (textWithoutCollege.includes(firstName) && firstName.length >= 4) {
        isMatch = true;
      }

      if (isMatch) {
        let displayName = m.title_or_person_name.split('(')[0].replace(/\.(jpg|jpeg|png|webp|gif|bmp)$/i, '').replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
        const dParts = displayName.split(' ');
        if (dParts.length === 2 && dParts[0] === dParts[1]) {
          displayName = dParts[0];
        }

        const alreadyAdded = matchedTeachers.some(t => {
          if (t.file_id === m.file_id) return true;
          const tFirst = t.name.replace(/^(ว่าที่ร้อยตรีหญิง|ว่าที่ ร\.ต\. หญิง|ว่าที่ ร\.ต\.หญิง|ว่าที่ร้อยตรี|ว่าที่ ร\.ต\.|นาย|นางสาว|นาง|ครู|อาจารย์)\s*/i, '').split(/\s+/)[0];
          return tFirst && firstName && tFirst === firstName;
        });

        if (!alreadyAdded) {
          matchedTeachers.push({
            name: displayName,
            department: m.title_or_person_name.includes('(') ? m.title_or_person_name.split('(')[1].replace(')', '').trim() : 'วิทยาลัยการอาชีพฝาง',
            imageUrl: m.image_url || `https://lh3.googleusercontent.com/d/${m.file_id}`,
            file_id: m.file_id
          });
        }
      }
    }

    if (matchedTeachers.length > 0) {
      return {
        imageUrl: matchedTeachers[0].imageUrl,
        caption: matchedTeachers.length === 1
          ? matchedTeachers[0].name
          : `${matchedTeachers[0].name} (และอีก ${matchedTeachers.length - 1} ท่าน)`,
        isWebAttachment: false,
        matchedTeachers
      };
    }

    // Second pass: match branch or department name in title_or_person_name (Exclude student uniform media and individual persons!)
    for (const m of cachedMedia) {
      if (isUniformAttachment(m.title_or_person_name)) continue;
      // Do not return individual teacher photos as a generic branch illustration
      if (/นาย|นางสาว|นาง|ว่าที่|ครู|อาจารย์|ดร\./.test(m.title_or_person_name || '')) continue;
      const fullTitle = (m.title_or_person_name || '').toLowerCase();
      if (primarySource?.title && fullTitle.includes(primarySource.title.replace(/^รายชื่อครูและบุคลากรสาขาวิชา/i, '').trim().toLowerCase())) {
        return {
          imageUrl: m.image_url,
          caption: m.title_or_person_name,
          isWebAttachment: false
        };
      }
    }

    // Third pass: match student uniform / dress code topic ONLY when question is genuinely asking about dress code
    if (isUniformQuery) {
      const qHasPws = qLower.includes('ปวส') || qLower.includes('ประกาศนียบัตรวิชาชีพชั้นสูง');
      const qHasPwc = (qLower.includes('ปวช') || qLower.includes('ประกาศนียบัตรวิชาชีพ')) && !qHasPws;
      const qHasAvt = qLower.includes('อวท');

      if (qHasAvt) {
        if (qHasPws) {
          const avtPws = cachedMedia.find(m => (m.title_or_person_name || '').toLowerCase().includes('ชุดอวท.ปวส'));
          if (avtPws) return { imageUrl: avtPws.image_url || `https://lh3.googleusercontent.com/d/${avtPws.file_id}`, caption: 'ชุด อวท. ปวส.', isWebAttachment: false };
        }
        const avtGen = cachedMedia.find(m => {
          const t = (m.title_or_person_name || '').toLowerCase();
          return t.includes('ชุดอวท.') && !t.includes('ปวส');
        }) || cachedMedia.find(m => (m.title_or_person_name || '').toLowerCase().includes('ชุดอวท'));
        if (avtGen) return { imageUrl: avtGen.image_url || `https://lh3.googleusercontent.com/d/${avtGen.file_id}`, caption: 'ชุด อวท.', isWebAttachment: false };
      }

      if (qHasPwc) {
        const pwc = cachedMedia.find(m => {
          const t = (m.title_or_person_name || '').toLowerCase();
          return t.includes('ชุดนร.ปวช') && !t.includes('ปวส');
        });
        if (pwc) return { imageUrl: pwc.image_url || `https://lh3.googleusercontent.com/d/${pwc.file_id}`, caption: 'ชุดนักเรียน ปวช.', isWebAttachment: false };
      }

      if (qHasPws) {
        const pws = cachedMedia.find(m => (m.title_or_person_name || '').toLowerCase().includes('ชุดนร.ปวส'));
        if (pws) return { imageUrl: pws.image_url || `https://lh3.googleusercontent.com/d/${pws.file_id}`, caption: 'ชุดนักศึกษา ปวส.', isWebAttachment: false };
      }

      // Default uniform if generic
      const defaultUniform = cachedMedia.find(m => (m.title_or_person_name || '').toLowerCase().includes('ชุดนร.ปวส')) ||
                             cachedMedia.find(m => (m.title_or_person_name || '').toLowerCase().includes('ชุดนร.ปวช'));
      if (defaultUniform) {
        return { imageUrl: defaultUniform.image_url || `https://lh3.googleusercontent.com/d/${defaultUniform.file_id}`, caption: defaultUniform.title_or_person_name, isWebAttachment: false };
      }
    }

    // Fourth pass: match general document/diagram/map media in title_or_person_name (e.g. Map / Building / Plan)
    for (const m of cachedMedia) {
      if (/^(นาย|นางสาว|นาง|ว่าที่|ครู|อาจารย์|ดร\.)/i.test((m.title_or_person_name || '').trim())) continue;
      if (isUniformAttachment(m.title_or_person_name)) continue;
      const rawDocName = (m.title_or_person_name.split('(')[0] || '').replace(/\.(jpg|jpeg|png|webp|gif|bmp)$/i, '').trim().toLowerCase();
      if (rawDocName && rawDocName.length >= 3 && combinedText.includes(rawDocName)) {
        return {
          imageUrl: m.image_url || `https://lh3.googleusercontent.com/d/${m.file_id}`,
          caption: m.title_or_person_name,
          isWebAttachment: false
        };
      }
    }
  } catch (e) {}

  // 3. Extract Drive URL from top sources (ONLY if it's explicitly an image file, NOT a PDF/Doc)
  if (!primarySource) return null;

  const fullContent = `${primarySource.title || ''} ${primarySource.content || ''} ${primarySource.summary || ''}`;
  const isDocContent = /pdf|แบบฟอร์ม|ดาวน์โหลดแบบฟอร์ม|ค\.ร\./i.test(fullContent);
  const folderMatch = fullContent.match(/drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/);
  const fileMatch = fullContent.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);

  if (fileMatch && fileMatch[1] && !isDocContent) {
    const fileId = fileMatch[1];
    return {
      imageUrl: `https://lh3.googleusercontent.com/d/${fileId}`,
      caption: primarySource.title,
      isWebAttachment: false
    };
  }

  if (folderMatch && folderMatch[1] && !isDocContent) {
    const folderId = folderMatch[1];
    
    // Dynamic Query to Google Apps Script Webhook
    try {
      const settingRow = db.prepare("SELECT value FROM system_settings WHERE key = 'google_apps_script_url'").get() as any;
      const appsScriptUrl = settingRow?.value;
      if (appsScriptUrl && appsScriptUrl.includes('/exec')) {
        const res = await fetch(`${appsScriptUrl}?action=get_folder_images&folderId=${folderId}`, {
          method: 'GET',
          signal: AbortSignal.timeout(4000)
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && Array.isArray(data.files)) {
            const insertMedia = db.prepare(`
              INSERT INTO drive_media_cache (media_id, folder_id, file_id, title_or_person_name, image_url, thumbnail_url, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
              ON CONFLICT(media_id) DO UPDATE SET
                title_or_person_name = excluded.title_or_person_name,
                image_url = excluded.image_url,
                thumbnail_url = excluded.thumbnail_url,
                updated_at = excluded.updated_at
            `);

            for (const f of data.files) {
              insertMedia.run(`med-${f.id}`, folderId, f.id, f.name, f.url, f.thumbnailUrl || f.url);
            }

            for (const f of data.files) {
              const cleanFileName = f.name.replace(/^(นาย|นางสาว|นาง|ว่าที่ร้อยตรี|ครู)\s*/i, '').trim().toLowerCase();
              if (combinedText.includes(f.name.toLowerCase()) || (cleanFileName.length >= 3 && combinedText.includes(cleanFileName))) {
                return {
                  imageUrl: f.url,
                  caption: f.name,
                  isWebAttachment: false
                };
              }
            }
          }
        }
      }
    } catch (err) {
      // Graceful fallback
    }
  }

  return null;
}

/**
 * Resolve Document / PDF attachment matching retrieved knowledge sources
 * Checks knowledge_attachments for PDF, DOCX, XLSX documents or Drive document links
 */
export async function resolveDocumentAttachmentForQuery(
  question: string,
  sources: any[]
): Promise<DocumentAttachmentInfo | null> {
  if (!sources || sources.length === 0) return null;
  const db = getDb();
  const primarySource = sources[0];

  // Personnel / Teacher inquiries do NOT expect document download cards unless the user explicitly asks for files/documents
  const isDocQuery = /เอกสาร|ไฟล์|แบบฟอร์ม|ฟอร์ม|ดาวน์โหลด|คู่มือ|คำร้อง|ระเบียบ|หลักสูตร|ประกาศ|หนังสือ|ค\.ร\.|pdf|doc|ใบสมัคร|ข้อบังคับ/i.test(question);
  const isPersonnelSource = /รายชื่อครู|บุคลากร|คณะผู้บริหาร|ทำเนียบ|ประวัติบุคลากร/i.test(primarySource?.title || '');
  if (isPersonnelSource && !isDocQuery) {
    return null;
  }

  try {
    const knowledgeIds = sources.map(s => s.knowledge_id).filter(Boolean);
    if (knowledgeIds.length > 0) {
      // 1. Check SQLite knowledge_attachments
      const placeholders = knowledgeIds.map(() => '?').join(',');
      const rows = db.prepare(`
        SELECT * FROM knowledge_attachments 
        WHERE knowledge_id IN (${placeholders})
        ORDER BY uploaded_at DESC
      `).all(...knowledgeIds) as any[];

      const validDocFilter = (att: any) => {
        if (!att || !att.file_url) return false;
        const url = String(att.file_url).trim();
        if (url.includes('sample_') || url.includes('dummy')) return false;

        // Reject folders! Google Drive folders are NOT downloadable document files!
        if (url.includes('/drive/folders/') || url.includes('/folders/')) return false;

        // Reject pure image files
        if (att.file_type === 'image') return false;
        if (/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(url)) return false;
        if (/\.(jpg|jpeg|png|webp|gif|svg)$/i.test(att.file_name || '')) return false;

        const isDocType = ['pdf', 'docx', 'xlsx', 'document', 'form'].includes(att.file_type);
        const isDocExt = /\.(pdf|docx|doc|xlsx|xls|pptx|ppt)(\?.*)?$/i.test(att.file_name || '') ||
                         /\.(pdf|docx|doc|xlsx|xls|pptx|ppt)(\?.*)?$/i.test(url);
        const isDriveFile = /https:\/\/(?:drive|docs)\.google\.com\/(?:file\/d\/|document\/d\/|spreadsheets\/d\/)/i.test(url);
        return (isDocType && isDocExt) || isDocExt || isDriveFile;
      };

      let validDocs = rows.filter(validDocFilter);
      let matchedDoc = validDocs.find(d => d.knowledge_id === primarySource.knowledge_id);

      // If not on primarySource, check Supabase
      if (!matchedDoc) {
        try {
          const { data: sbAtts } = await supabaseAdmin
            .from('knowledge_attachments')
            .select('*')
            .in('knowledge_id', knowledgeIds)
            .order('uploaded_at', { ascending: false });

          if (sbAtts && sbAtts.length > 0) {
            const validSbDocs = sbAtts.filter(validDocFilter);
            matchedDoc = validSbDocs.find(d => d.knowledge_id === primarySource.knowledge_id) || validSbDocs[0];
          }
        } catch {}
      }

      if (!matchedDoc && validDocs.length > 0) {
        matchedDoc = validDocs[0];
      }

      if (matchedDoc) {
        return {
          attachment_id: matchedDoc.attachment_id,
          knowledge_id: matchedDoc.knowledge_id,
          file_name: matchedDoc.file_name || `${primarySource.title}.pdf`,
          file_url: matchedDoc.file_url,
          file_type: matchedDoc.file_type || 'pdf',
          file_size_kb: matchedDoc.file_size_kb
        };
      }
    }

    // 2. Fallback: Check if primarySource content or summary contains a direct Google Drive document link
    const fullText = `${primarySource.content || ''} ${primarySource.summary || ''}`;
    const driveDocMatch = fullText.match(/https:\/\/(?:drive|docs)\.google\.com\/(?:file\/d\/|document\/d\/|spreadsheets\/d\/)[a-zA-Z0-9_\-]+[^\s\)\"\']*/);
    if (driveDocMatch && !driveDocMatch[0].includes('sample_') && !driveDocMatch[0].includes('/folders/')) {
      return {
        knowledge_id: primarySource.knowledge_id,
        file_name: `${primarySource.title} (เอกสารแนบ)`,
        file_url: driveDocMatch[0],
        file_type: 'pdf'
      };
    }
  } catch (err) {
    console.warn('Error resolving document attachment:', err);
  }

  return null;
}
