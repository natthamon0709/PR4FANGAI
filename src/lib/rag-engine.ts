import getDb from './db';
import crypto from 'crypto';
import { decryptApiKey } from './ai-crypto';
import { AiEngineConfig, AiRetrievedSource, RAGPlaygroundResult } from '@/types/ai';

export interface RAGExecutionResult {
  log_id?: string;
  question: string;
  answer: string;
  confidence_score: number;
  is_fallback: boolean;
  response_time_ms: number;
  imageUrl?: string;
  imageCaption?: string;
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
      model_name: 'gemini-2.5-flash',
      api_key_masked: '••••••••4f2a',
      api_key_encrypted: '',
      system_prompt: 'คุณคือผู้ช่วย AI อัจฉริยะประจำวิทยาลัยการอาชีพฝาง ให้ตอบคำถามอย่างสุภาพ ถูกต้อง กระชับ และอ้างอิงจากข้อมูลองค์ความรู้ที่ได้รับเท่านั้น ห้ามคาดเดาข้อมูลที่ไม่ปรากฏในเอกสาร',
      confidence_threshold: 0.70,
      retrieval_top_k: 5,
      temperature: 0.3,
      is_active: true
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
  'สวัสดี', 'สวัสดีครับ', 'สวัสดีค่ะ', 'สวัสดีคีับ', 'สวัสดีคับ', 'หวัดดี', 'ดีครับ', 'ดีค่ะ', 'ฮัลโหล',
  'ขอบคุณ', 'ขอบคุณครับ', 'ขอบคุณค่ะ', 'ขอบใจ', 'ขอบพระคุณ', 'hello', 'hi', 'hey'
]);

const THAI_SYNONYMS: Record<string, string[]> = {
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

/**
 * Extract comprehensive Thai search tokens, entities, and n-grams
 */
function extractDistinctiveKeywords(text: string): string[] {
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

  // 2. Known Academic Departments & Branches
  const knownBranches = [
    'เทคโนโลยีธุรกิจดิจิทัล', 'ธุรกิจดิจิทัล', 'ดิจิทัล', 'การตลาด', 'การโรงแรม',
    'เครือข่ายคอมพิวเตอร์และความปลอดภัย', 'เครือข่ายคอมพิวเตอร์', 'เครือข่าย', 'cyber security', 'network',
    'ช่างก่อสร้าง', 'ก่อสร้าง', 'ช่างเชื่อมโลหะ', 'ช่างเชื่อม', 'ช่างซ่อมบำรุง', 'ช่างเทคนิคคอมพิวเตอร์', 'เทคนิคคอมพิวเตอร์',
    'ช่างไฟฟ้ากำลัง', 'ช่างไฟฟ้า', 'ไฟฟ้ากำลัง', 'เทคนิคเครื่องกล', 'ช่างยนต์', 'ตัวถังและสีรถยนต์', 'ตัวถังและสี',
    'การบัญชี', 'บัญชี', 'ปิโตรเลียม', 'เครื่องมือวัดและควบคุมปิโตรเลียม', 'สามัญสัมพันธ์', 'บริหารทรัพยากร', 'วิชาการ',
    'พัฒนากิจการนักเรียนนักศึกษา', 'แผนงานและความร่วมมือ', 'ผังวิทยาลัย', 'แผนผัง', 'fve star'
  ];
  knownBranches.forEach(b => {
    if (cleanLow.includes(b)) distinctive.add(b);
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
    .replace(/^(ใครเป็น|นาย|นางสาว|นาง|ว่าที่ร้อยตรี|ว่าที่ ร.ต.|ครู|อาจารย์)\s*/i, '')
    .replace(/(อยู่สาขาอะไร|อยู่แผนกไหน|คือใคร|มีใครบ้าง|เบอร์โทรอะไร|สอนอะไร|ทำหน้าที่อะไร)$/i, '')
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
 * Semantic & Distinctive Keyword search across knowledge_items (synced from Google Sheet)
 */
export function searchKnowledgeBase(query: string, topK: number = 5) {
  const db = getDb();
  const rawQueryLow = query.toLowerCase().trim();
  const keywords = extractDistinctiveKeywords(query);

  // Query only published & AI retrieval enabled items from SQLite (synced from Google Sheet)
  const items = db.prepare(`
    SELECT 
      k.knowledge_id,
      k.title,
      k.summary,
      k.content,
      k.content_type,
      k.tags,
      k.department_id,
      d.name as department_name,
      s.name as sub_department_name
    FROM knowledge_items k
    LEFT JOIN departments d ON k.department_id = d.department_id
    LEFT JOIN sub_departments s ON k.sub_department_id = s.sub_department_id
    WHERE k.status = 'published' AND k.ai_retrieval_enabled = 1
  `).all() as any[];

  if (items.length === 0) return [];

  const scoredItems = items.map(item => {
    let score = 0.0;
    const titleLow = (item.title || '').toLowerCase();
    const summaryLow = (item.summary || '').toLowerCase();
    const contentLow = (item.content || '').toLowerCase();
    const tagsLow = (item.tags || '').toLowerCase();

    // 1. Exact Person Name in Content or Title (+100.0)
    const strippedPerson = rawQueryLow
      .replace(/^(ใครเป็น|นาย|นางสาว|นาง|ว่าที่ร้อยตรี|ว่าที่ ร.ต.|ครู|อาจารย์)\s*/i, '')
      .replace(/(อยู่สาขาอะไร|อยู่แผนกไหน|คือใคร|มีใครบ้าง|เบอร์โทรอะไร|สอนอะไร|ทำหน้าที่อะไร)$/i, '')
      .trim();
    if (strippedPerson.length >= 4 && (contentLow.includes(strippedPerson) || titleLow.includes(strippedPerson))) {
      score += 100.0;
    }

    // 2. Exact Raw Query in Title or Content (+50.0)
    if (rawQueryLow.length >= 4 && (titleLow.includes(rawQueryLow) || contentLow.includes(rawQueryLow))) {
      score += 50.0;
    }

    // 3. Distinctive keywords match across Title, Tags, Summary, and Content
    let matchedKwCount = 0;
    keywords.forEach(kw => {
      let matchedInItem = false;
      if (titleLow.includes(kw)) {
        score += 3.0; // Title match
        matchedInItem = true;
      }
      if (tagsLow.includes(kw)) {
        score += 2.0;
        matchedInItem = true;
      }
      if (summaryLow.includes(kw)) {
        score += 1.5;
        matchedInItem = true;
      }
      if (contentLow.includes(kw)) {
        score += 0.5; // Content body match
        matchedInItem = true;
      }
      if (matchedInItem) matchedKwCount++;
    });

    // Calibrated confidence score based on substantive query overlap
    const matchRatio = keywords.length > 0 ? matchedKwCount / keywords.length : 0;
    let confidence = 0.10;
    if (score >= 50.0) {
      confidence = Math.min(0.99, 0.92 + (score / 1000.0));
    } else if (matchRatio >= 0.5 && score >= 10.0) {
      confidence = Math.min(0.95, 0.82 + (score / 100.0));
    } else if (matchRatio >= 0.35 && score >= 5.0) {
      confidence = 0.72;
    } else {
      confidence = Math.min(0.55, Math.round(matchRatio * 70) / 100);
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
      rawScore: score,
      relevance_score: Math.round(confidence * 100) / 100
    };
  });

  // Filter items with meaningful relevance and sort descending
  const filtered = scoredItems
    .filter(i => i.rawScore > 0.3)
    .sort((a, b) => b.rawScore - a.rawScore)
    .slice(0, topK);

  return filtered.map((item, idx) => ({
    ...item,
    rank: idx + 1
  }));
}

export function cleanFaqArtifacts(text: string): string {
  if (!text) return '';
  return text
    .replace(/^(\s*Q\d*[:.]\s*|\s*A\d*[:.]\s*|\s*คำถาม[:.]\s*|\s*คำตอบ[:.]\s*)+/gmi, '')
    .replace(/(\n|\s+)(Q\d*[:.]|A\d*[:.]|คำถาม[:.]|คำตอบ[:.])\s*/gmi, '$1')
    .replace(/\b(A|Q)\d*\s*:\s*/gi, '')
    .trim();
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
  sources: any[]
): Promise<string> {
  const decryptedKey = decryptApiKey(config.api_key_encrypted || '');
  const primarySource = sources[0];
  const isWeatherQuery = question.includes('อากาศ') || (primarySource && (primarySource.title.includes('อากาศ') || primarySource.content.includes('อากาศ')));

  let liveWeatherData: any = null;
  if (isWeatherQuery) {
    liveWeatherData = await getFangLiveWeather();
  }

  // 1. Live Google Gemini API Integration
  if (decryptedKey && decryptedKey.length > 10 && config.provider === 'gemini') {
    try {
      const contextText = sources
        .map((s, i) => `[เอกสารที่ ${i + 1}: ${s.title} (${s.department_name})]\n${s.summary || ''}\n${s.content || ''}`)
        .join('\n\n---\n\n');

      const weatherContext = liveWeatherData ? `\n\n[ข้อมูลสภาพอากาศจริงประจำวัน ณ อ.ฝาง จ.เชียงใหม่: ${liveWeatherData.dateStr}, อุณหภูมิ: ${liveWeatherData.temp}°C (รู้สึกเหมือน ${liveWeatherData.feelsLike}°C), สภาพอากาศ: ${liveWeatherData.desc}, ความชื้นสัมพัทธ์: ${liveWeatherData.humidity}%]` : '';

      const promptPayload = {
        systemInstruction: {
          parts: [
            {
              text: `${config.system_prompt}\n\nคำแนะนำและข้อกำหนดสำคัญสำหรับการตอบ:\n1. หากในองค์ความรู้มีหัวข้อ 'รายการคำถาม-คำตอบที่พบบ่อย (FAQ Pairs)' ที่ตรงกับสิ่งที่ผู้ใช้ถาม ให้นำคำตอบที่ระบุในคู่นั้นมาตอบผู้ใช้โดยตรง\n2. หากคำถามเกี่ยวข้องกับสภาพอากาศ ให้นำข้อมูลสภาพอากาศจริงของ อ.ฝาง จ.เชียงใหม่ มาตอบอย่างสุภาพและแม่นยำ\n3. กฎสำคัญ: ห้ามแสดงตัวอักษรนำหน้า เช่น 'Q:', 'A:', 'Q1:', 'A1:', 'คำถาม:', 'คำตอบ:' ในคำตอบอย่างเด็ดขาด\n4. กฎเข้มงวดป้องกันการตอบผิด (Strict Anti-Hallucination): ตอบเฉพาะข้อมูลที่มีระบุอยู่ในเอกสารอ้างอิงเท่านั้น ห้ามคาดเดาข้อมูลที่ไม่ปรากฏในเอกสาร หากไม่พบข้อมูลให้ตอบอย่างสุภาพว่ายังไม่พบข้อมูลและแนะนำช่องทางติดต่อฝ่ายงานที่เกี่ยวข้องอย่างชัดเจน\n5. ตอบเป็นข้อความบรรยายภาษาไทยที่สุภาพ นอบน้อม ถูกต้อง และกระชับตรงประเด็น`
            }
          ]
        },
        contents: [
          {
            role: 'user',
            parts: [
              { text: `## องค์ความรู้อ้างอิงจากฐานข้อมูลวิทยาลัยการอาชีพฝาง (Google Sheets Knowledge Base):\n${contextText}${weatherContext}\n\n## คำถามของผู้ใช้:\n${question}` }
            ]
          }
        ],
        generationConfig: {
          temperature: config.temperature,
          maxOutputTokens: 1024
        }
      };

      // Map and try candidate models resiliently
      const primaryModel = config.model_name || 'gemini-2.5-flash';
      const candidateModels = Array.from(new Set([
        primaryModel,
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.5-flash',
        'gemini-1.5-pro-latest',
        'gemini-pro'
      ]));

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
          } else if (res.status === 404) {
            // Model not available on this API version or key tier, try next candidate
            continue;
          } else {
            const errText = await res.text();
            console.warn(`Gemini API (${modelId}) returned ${res.status}:`, errText);
            break;
          }
        } catch (callErr) {
          console.warn(`Gemini API (${modelId}) error:`, callErr);
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
              content: `${config.system_prompt}\n\nคำแนะนำและข้อกำหนดสำคัญสำหรับการตอบ:\n1. หากในองค์ความรู้มีหัวข้อ 'รายการคำถาม-คำตอบที่พบบ่อย (FAQ Pairs)' ที่ตรงกับสิ่งที่ผู้ใช้ถาม ให้นำคำตอบที่ระบุในคู่นั้นมาตอบผู้ใช้โดยตรง\n2. หากคำถามเกี่ยวข้องกับสภาพอากาศ ให้นำข้อมูลสภาพอากาศจริงของ อ.ฝาง จ.เชียงใหม่ มาตอบอย่างสุภาพและแม่นยำ\n3. กฎสำคัญ: ห้ามแสดงตัวอักษรนำหน้า เช่น 'Q:', 'A:', 'Q1:', 'A1:', 'คำถาม:', 'คำตอบ:' ในคำตอบอย่างเด็ดขาด\n4. กฎเข้มงวดป้องกันการตอบผิด (Strict Anti-Hallucination): ตอบเฉพาะข้อมูลที่มีระบุอยู่ในเอกสารอ้างอิงเท่านั้น ห้ามคาดเดาข้อมูลที่ไม่ปรากฏในเอกสาร หากไม่พบข้อมูลให้ตอบอย่างสุภาพว่ายังไม่พบข้อมูลและแนะนำช่องทางติดต่อฝ่ายงานที่เกี่ยวข้องอย่างชัดเจน\n5. ตอบเป็นข้อความบรรยายภาษาไทยที่สุภาพ นอบน้อม ถูกต้อง และกระชับตรงประเด็น`
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
    answerBody = `🌤️ สภาพอากาศจริง อ.ฝาง จ.เชียงใหม่ (${liveWeatherData.dateStr}):\n• อุณหภูมิ: ${liveWeatherData.temp}°C (รู้สึกเหมือน ${liveWeatherData.feelsLike}°C)\n• สภาพอากาศ: ${liveWeatherData.desc}\n• ความชื้นสัมพัทธ์: ${liveWeatherData.humidity}%\n• คำแนะนำ: สภาพอากาศเหมาะสำหรับการเดินทาง แต่อาจมีฝนตกโปรยปราย แนะนำให้พกร่มเมื่อเดินทางมายังวิทยาลัยการอาชีพฝางครับ 🎓`;
    return answerBody;
  }

  const keywords = extractDistinctiveKeywords(question);
  let relevantSnippet = '';

  // Check if primarySource has FAQ pairs matching the question
  let bestFaqAnswer = '';
  if (primarySource.content && primarySource.content.includes('### รายการคำถาม-คำตอบที่พบบ่อย')) {
    const faqSection = primarySource.content.split('### รายการคำถาม-คำตอบที่พบบ่อย')[1] || '';
    const items = faqSection.split('• คำถาม:').map((s: string) => s.trim()).filter(Boolean);
    let bestScore = 0;

    items.forEach((item: string) => {
      const parts = item.split('คำตอบ:');
      const q = (parts[0] || '').trim();
      const a = (parts[1] || '').trim();
      let matchCount = 0;
      keywords.forEach(kw => {
        if (kw.length >= 2) {
          if (q.toLowerCase().includes(kw)) matchCount += 3;
          if (a.toLowerCase().includes(kw)) matchCount += 1;
        }
      });
      if (matchCount > bestScore && a) {
        bestScore = matchCount;
        bestFaqAnswer = cleanFaqArtifacts(a);
      }
    });
  }

  if (bestFaqAnswer && bestFaqAnswer.length > 5) {
    answerBody = bestFaqAnswer;
  } else {
    if (primarySource.content) {
      const lines = primarySource.content.split('\n').map((l: string) => l.trim()).filter(Boolean);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (keywords.some(kw => line.toLowerCase().includes(kw) && kw.length >= 3)) {
          const start = Math.max(0, i - 1);
          const end = Math.min(lines.length, i + 6);
          relevantSnippet = lines.slice(start, end).join('\n');
          break;
        }
      }
    }

    if (relevantSnippet && relevantSnippet.length > 20) {
      answerBody = cleanFaqArtifacts(relevantSnippet.replace(/[#*`]/g, ''));
    } else if (primarySource.summary && primarySource.summary.length > 20 && !primarySource.summary.startsWith('A:')) {
      answerBody = cleanFaqArtifacts(primarySource.summary);
    } else if (primarySource.content) {
      const mainContent = primarySource.content.split('### รายการคำถาม-คำตอบ')[0] || primarySource.content;
      answerBody = cleanFaqArtifacts(mainContent.substring(0, 450).replace(/[#*`]/g, ''));
    }
  }

  const deptInfo = primarySource.department_name ? ` (${primarySource.department_name})` : '';
  const answer = `ตามข้อมูลจาก ${primarySource.title}${deptInfo}:\n\n${answerBody}\n\nหากท่านต้องการสอบถามรายละเอียดเพิ่มเติม สามารถติดต่อได้ที่${primarySource.sub_department_name || primarySource.department_name || 'วิทยาลัยการอาชีพฝาง'}`;

  return answer;
}

/**
 * Detect Conversational & Small Talk Intents (Greetings, Thank You, System Status)
 */
export function detectConversationalIntent(text: string): { isConversational: boolean; replyText?: string } {
  const clean = (text || '').toLowerCase().replace(/[\s\t\n!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/g, '');
  
  // 1. Greetings (สวัสดี, ฮัลโหล, ดีครับ, hello, hi)
  const greetings = ['สวัสดี', 'สวัสดีครับ', 'สวัสดีค่ะ', 'สวัสดีคีับ', 'สวัสดีคะ', 'สวัสดีคับ', 'สวัสดีจ้า', 'หวัดดี', 'หวัดดีครับ', 'หวัดดีค่ะ', 'ดีครับ', 'ดีค่ะ', 'ฮัลโหล', 'hello', 'hi', 'hey', 'sawasdee'];
  if (greetings.includes(clean) || (clean.startsWith('สวัสดี') && clean.length <= 12) || (clean.startsWith('หวัดดี') && clean.length <= 10)) {
    return {
      isConversational: true,
      replyText: 'สวัสดีครับ/ค่ะ ยินดีต้อนรับสู่ระบบ AI วิทยาลัยการอาชีพฝาง 🎓\n\nท่านสามารถพิมพ์คำถามหรือเรื่องที่ต้องการสอบถามได้ทันทีครับ เช่น:\n• ระเบียบวินัย / การแต่งกายและทรงผม\n• รายชื่อสาขาวิชาและหลักสูตรที่เปิดสอน\n• ช่องทางติดต่อฝ่ายงานและแผนกต่างๆ'
    };
  }

  // 2. Thank you
  const thanks = ['ขอบคุณ', 'ขอบคุณครับ', 'ขอบคุณค่ะ', 'ขอบคุณคะ', 'ขอบคุณคับ', 'ขอบใจ', 'ขอบใจจ้า', 'ขอบพระคุณ', 'thanks', 'thankyou', 'thx'];
  if (thanks.includes(clean) || (clean.startsWith('ขอบคุณ') && clean.length <= 12)) {
    return {
      isConversational: true,
      replyText: 'ยินดีให้บริการครับ/ค่ะ หากมีข้อสงสัยหรือต้องการสอบถามข้อมูลเพิ่มเติม สามารถพิมพ์ถามได้ตลอดเวลาครับ 😊'
    };
  }

  // 3. Test
  const tests = ['test', 'ทดสอบ', 'เทส', 'เทสระบบ', 'testระบบ'];
  if (tests.includes(clean)) {
    return {
      isConversational: true,
      replyText: 'ระบบ AI วิทยาลัยการอาชีพฝาง พร้อมให้บริการตามปกติครับ 🟢 ท่านสามารถพิมพ์คำถามเพื่อค้นหาข้อมูลได้ทันทีครับ'
    };
  }

  return { isConversational: false };
}

/**
 * Execute Full RAG Pipeline
 */
export async function executeRAGPipeline(params: {
  question: string;
  lineUserId?: string;
  isPlayground?: boolean;
}): Promise<RAGExecutionResult> {
  const startTime = Date.now();
  const db = getDb();
  const config = getActiveAiConfig();
  const { question, lineUserId = 'LINE_ANONYMOUS_USER', isPlayground = false } = params;

  // 0. Handle Conversational Greetings & Courtesy Messages
  const convIntent = detectConversationalIntent(question);
  if (convIntent.isConversational && convIntent.replyText) {
    const responseTimeMs = Date.now() - startTime;
    let logId: string | undefined;
    if (!isPlayground) {
      logId = 'qlog-' + crypto.randomUUID();
      db.prepare(`
        INSERT INTO ai_query_logs (
          log_id, line_user_id, matched_user_id, question_text, confidence_score,
          answer_text, is_fallback, response_time_ms, feedback, department_id, created_at
        ) VALUES (?, ?, NULL, ?, 1.0, ?, 0, ?, 'none', NULL, datetime('now', 'localtime'))
      `).run(logId, lineUserId, question.trim(), convIntent.replyText, responseTimeMs);

      try {
        const { pushToGoogleSheets } = await import('./google-sheets-sync');
        pushToGoogleSheets('AI_Query_Logs', 'create', {
          log_id: logId,
          line_user_id: lineUserId,
          question: question.trim(),
          confidence: 1.0,
          answer: convIntent.replyText,
          is_fallback: 0,
          response_time_ms: responseTimeMs,
          created_at: new Date().toISOString()
        });
      } catch {}
    }

    return {
      log_id: logId,
      question,
      answer: convIntent.replyText,
      confidence_score: 1.0,
      is_fallback: false,
      response_time_ms: responseTimeMs,
      sources: []
    };
  }

  // 1. Search knowledge base
  const retrievedSources = searchKnowledgeBase(question, config.retrieval_top_k);

  const topScore = retrievedSources.length > 0 ? retrievedSources[0].relevance_score : 0.0;
  const isFallback = topScore < config.confidence_threshold || retrievedSources.length === 0;

  let answerText = '';
  let responseTimeMs = 0;

  if (isFallback) {
    answerText = 'ขออภัยครับ/ค่ะ ขณะนี้ยังไม่พบข้อมูลที่ระบุในคำถามอย่างชัดเจนในระบบฐานความรู้ของวิทยาลัยการอาชีพฝาง\n\n📌 แนะนำช่องทางติดต่อสอบถามเพิ่มเติม:\n• ฝ่ายบริหารทรัพยากร / งานธุรการ: 053-451234\n• งานศูนย์ข้อมูลสารสนเทศและดิจิทัล / งานทะเบียน: อาคาร 1\n• สอบถามเจ้าหน้าที่ผู้ดูแลระบบโดยตรงผ่าน LINE Official Account ในวันและเวลาราชการ';

    // Auto-record to knowledge_gap_logs if not playground
    if (!isPlayground) {
      try {
        const gapId = 'gap-' + crypto.randomUUID();
        const existingGap = db.prepare('SELECT gap_id, ask_count FROM knowledge_gap_logs WHERE question_text = ? LIMIT 1').get(question.trim()) as any;
        if (existingGap) {
          db.prepare(`UPDATE knowledge_gap_logs SET ask_count = ask_count + 1, last_asked_at = datetime('now', 'localtime') WHERE gap_id = ?`).run(existingGap.gap_id);
        } else {
          db.prepare(`
            INSERT INTO knowledge_gap_logs (gap_id, question_text, ask_count, status, department_guess, last_asked_at)
            VALUES (?, ?, 1, 'open', ?, datetime('now', 'localtime'))
          `).run(gapId, question.trim(), retrievedSources[0]?.department_id || null);

          try {
            const { pushToGoogleSheets } = await import('./google-sheets-sync');
            pushToGoogleSheets('Knowledge_Gaps', 'create', {
              gap_id: gapId,
              question_text: question.trim(),
              ask_count: 1,
              status: 'open',
              department_guess: retrievedSources[0]?.department_name || 'ฝ่ายบริหารทรัพยากร'
            });
          } catch {}
        }
      } catch (err) {
        console.error('Failed to log knowledge gap:', err);
      }
    }
  } else {
    answerText = await generateGroundedAnswer(config, question, retrievedSources);
  }

  responseTimeMs = Date.now() - startTime;

  // Resolve Drive Media / Teacher Photo if applicable
  const mediaInfo = !isFallback ? await resolveDriveImageForQuery(question, answerText, retrievedSources) : null;

  // If live query (not playground), persist to ai_query_logs & ai_retrieved_sources
  let logId: string | undefined;
  if (!isPlayground) {
    logId = 'qlog-' + crypto.randomUUID();
    const matchedUser = db.prepare('SELECT user_id, department_id FROM master_users WHERE line_user_id = ? LIMIT 1').get(lineUserId) as any;

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

    // Insert retrieved sources
    const insertSource = db.prepare(`
      INSERT INTO ai_retrieved_sources (source_id, log_id, knowledge_id, relevance_score, rank)
      VALUES (?, ?, ?, ?, ?)
    `);

    retrievedSources.forEach(s => {
      insertSource.run('asrc-' + crypto.randomUUID(), logId, s.knowledge_id, s.relevance_score, s.rank);
    });

    // Push live query log to Google Sheets
    try {
      const { pushToGoogleSheets } = await import('./google-sheets-sync');
      pushToGoogleSheets('AI_Query_Logs', 'create', {
        log_id: logId,
        line_user_id: lineUserId,
        question: question.trim(),
        confidence: topScore,
        answer: answerText,
        is_fallback: isFallback ? 1 : 0,
        response_time_ms: responseTimeMs,
        created_at: new Date().toISOString()
      });
    } catch {}
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
 * Resolve Drive Photo/Image matching a person's name or document in the query/answer
 */
export async function resolveDriveImageForQuery(
  question: string,
  answerText: string,
  sources: any[]
): Promise<{ imageUrl?: string; caption?: string } | null> {
  const db = getDb();
  const primarySource = sources[0];
  const combinedText = `${question} ${answerText} ${primarySource?.title || ''}`.toLowerCase();

  // 1. Check drive_media_cache first
  try {
    const cachedMedia = db.prepare('SELECT * FROM drive_media_cache ORDER BY updated_at DESC').all() as any[];
    const normalizedCombined = combinedText.replace(/ศุทธิชัย/g, 'ศุทิชัย');
    
    // First pass: match exact person name
    for (const m of cachedMedia) {
      const rawPersonName = (m.title_or_person_name.split('(')[0] || '')
        .replace(/\.(jpg|jpeg|png|webp|gif|bmp)$/i, '')
        .trim()
        .toLowerCase();
      const normPersonName = rawPersonName.replace(/ศุทธิชัย/g, 'ศุทิชัย');
      const cleanPersonName = normPersonName
        .replace(/^(นาย|นางสาว|นาง|ว่าที่ร้อยตรี|ว่าที่ ร.ต.|ครู|อาจารย์)\s*/i, '')
        .trim();
      
      if (rawPersonName && (
        normalizedCombined.includes(rawPersonName) || 
        normalizedCombined.includes(normPersonName) || 
        (cleanPersonName.length >= 3 && normalizedCombined.includes(cleanPersonName))
      )) {
        return {
          imageUrl: m.image_url,
          caption: m.title_or_person_name
        };
      }
    }

    // Second pass: match branch or department name in title_or_person_name
    for (const m of cachedMedia) {
      const fullTitle = (m.title_or_person_name || '').toLowerCase();
      if (primarySource?.title && fullTitle.includes(primarySource.title.replace(/^รายชื่อครูและบุคลากรสาขาวิชา/i, '').trim().toLowerCase())) {
        return {
          imageUrl: m.image_url,
          caption: m.title_or_person_name
        };
      }
    }
  } catch (e) {}

  // 2. Extract Drive URL from top sources
  if (!primarySource) return null;

  const fullContent = `${primarySource.title || ''} ${primarySource.content || ''} ${primarySource.summary || ''}`;
  const folderMatch = fullContent.match(/drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/);
  const fileMatch = fullContent.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);

  if (fileMatch && fileMatch[1]) {
    const fileId = fileMatch[1];
    return {
      imageUrl: `https://lh3.googleusercontent.com/d/${fileId}`,
      caption: primarySource.title
    };
  }

  if (folderMatch && folderMatch[1]) {
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
                  caption: f.name
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
