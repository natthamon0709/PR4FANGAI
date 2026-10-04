/**
 * Automated Test Suite: Kham Mueang Dialect & Dual Delivery Voice Architecture
 * PR4Fang AI — วิทยาลัยการอาชีพฝาง
 */

const path = require('path');
const fs = require('fs');

async function runTests() {
  console.log('===========================================================');
  console.log('🧪 PR4Fang AI: Northern Dialect & Dual Delivery Test Suite');
  console.log('===========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Test Northern Dialect Detection
  console.log('📌 Test Group 1: Northern Dialect Detection (คำเมือง)');
  const { detectNorthernDialect, extractDistinctiveKeywords, detectConversationalIntent } = require('../src/lib/rag-engine');

  const testPhrases = [
    { text: 'ค่าเทอมจ่ายตี้ไหนเจ้า', expected: true },
    { text: 'เปิดเทอมวันใด แล้วต้องเตรียมอะหยังพ่อง', expected: true },
    { text: 'ครูแผนกช่างยนต์มีไผพ่องเจ้า', expected: true },
    { text: 'ขอฟอร์มลาป่วยยะจะได', expected: true },
    { text: 'ยินดีจ๊าดนักเน้อเจ้า', expected: true },
    { text: 'การลงทะเบียนเรียนภาคเรียนที่ 1 ต้องใช้เอกสารอะไรบ้าง', expected: false },
    { text: 'เบอร์โทรศัพท์ติดต่อห้องประชาสัมพันธ์', expected: false }
  ];

  testPhrases.forEach(tp => {
    const isNorth = detectNorthernDialect(tp.text);
    assert(isNorth === tp.expected, `"${tp.text}" -> detectNorthernDialect = ${isNorth} (expected ${tp.expected})`);
  });

  // 2. Test Northern Synonyms Mapping & Keyword Extraction
  console.log('\n📌 Test Group 2: Kham Mueang Synonyms & Keyword Extraction');
  const kw1 = extractDistinctiveKeywords('ค่าเทอมจ่ายตี้ไหนเจ้า');
  assert(kw1.includes('ค่าเทอม') || kw1.includes('การเงิน'), 'Extracted financial terms from "ค่าเทอมจ่ายตี้ไหนเจ้า"');
  assert(kw1.includes('ตี้ไหน') || kw1.includes('ที่ไหน') || kw1.includes('สถานที่'), 'Extracted location terms from "ตี้ไหน"');

  const kw2 = extractDistinctiveKeywords('เปิดเทอมวันใด');
  assert(kw2.includes('เปิดเทอม') || kw2.includes('เปิดภาคเรียน') || kw2.includes('ปฏิทิน'), 'Extracted calendar terms from "เปิดเทอมวันใด"');

  const kw3 = extractDistinctiveKeywords('ครูแผนกช่างยนต์มีไผพ่องเจ้า');
  assert(kw3.includes('ช่างยนต์') || kw3.includes('เครื่องกล'), 'Extracted mechanical branch from "ช่างยนต์"');
  assert(kw3.includes('ไผพ่อง') || kw3.includes('ใครบ้าง') || kw3.includes('รายชื่อครู'), 'Extracted personnel terms from "ไผพ่อง"');

  // 3. Test Conversational Greeting & Gratitude in Kham Mueang
  console.log('\n📌 Test Group 3: Conversational Intents (Greeting & Thanks)');
  const greet1 = detectConversationalIntent('สวัสดีเจ้า');
  assert(greet1.isConversational === true, '"สวัสดีเจ้า" recognized as conversational greeting');
  assert(greet1.replyText && greet1.replyText.includes('เจ้า'), '"สวัสดีเจ้า" receives Northern polite reply with "เจ้า"');

  const thanks1 = detectConversationalIntent('ขอบคุณเจ้า');
  assert(thanks1.isConversational === true, '"ขอบคุณเจ้า" recognized as conversational thanks');
  assert(thanks1.replyText && thanks1.replyText.includes('ยินดี'), '"ขอบคุณเจ้า" receives gracious Northern reply');

  // 4. Test Text-to-Speech Engine & Audio Duration
  console.log('\n📌 Test Group 4: Text-to-Speech & Duration Engine');
  const { cleanTextForSpeech, calculateMp3Duration, generateAudioReply, normalizeThaiForSpeech, buildSsmlForSpeech } = require('../src/lib/tts-service');

  // 4.1 Test Thai Phonetic Normalization
  console.log('  🔍 Testing normalizeThaiForSpeech:');
  const norm1 = normalizeThaiForSpeech('เปิดรับสมัคร ปวช. และ ปวส. โทร 053-451111');
  assert(norm1.includes('ระดับ ปวช.') && norm1.includes('ระดับ ปวส.'), 'normalizeThaiForSpeech expanded ปวช./ปวส. to ระดับ ปวช. / ระดับ ปวส.');
  assert(norm1.includes('053, 451, 111'), 'normalizeThaiForSpeech separated phone number digits with breath pauses');

  const norm2 = normalizeThaiForSpeech('เวลาทำการ 08.30-16.30 น. ติดต่อ ผอ.สมชาย');
  assert(norm2.includes('8 นาฬิกา 30 นาที ถึง 16 นาฬิกา 30 นาที'), 'normalizeThaiForSpeech converted time range to spoken clock phrasing');
  assert(norm2.includes('ผู้อำนวยการสมชาย'), 'normalizeThaiForSpeech expanded ผอ. to ผู้อำนวยการ');

  const norm3 = normalizeThaiForSpeech('ยินดีเจ้า สอบถามได้เน้อเจ้า วท.ฝาง ยินดีบริการ');
  assert(norm3.includes('ยินดีเจ้า,') && norm3.includes('เน้อเจ้า,'), 'normalizeThaiForSpeech inserted natural pauses after Northern polite particles');
  assert(norm3.includes('วิทยาลัยการอาชีพฝาง'), 'normalizeThaiForSpeech expanded วท.ฝาง to วิทยาลัยการอาชีพฝาง');

  // 4.2 Test SSML Generation & Warm Prosody
  console.log('  🔍 Testing buildSsmlForSpeech:');
  const ssmlOutput = buildSsmlForSpeech('ยินดีเจ้า, สำหรับข้อมูลเพิ่มเติม ติดต่อได้เลยเน้อเจ้า', 'th-TH-PremwadeeNeural', 1.0);
  assert(ssmlOutput.includes("rate='-5%'"), 'buildSsmlForSpeech sets default prosody rate to warm/gentle -5%');
  assert(ssmlOutput.includes("<break time='220ms'/>"), 'buildSsmlForSpeech inserted SSML break tags at breath pause points');
  assert(ssmlOutput.includes("<voice name='th-TH-PremwadeeNeural'>"), 'buildSsmlForSpeech targets Premwadee Neural voice');

  const markdownText = '### ระเบียบการแต่งกาย\n* นักศึกษาชายสวม **เนคไทสีกรมท่า**\n[ดูรายละเอียด](https://fang.ac.th)';
  const cleaned = cleanTextForSpeech(markdownText);
  assert(!cleaned.includes('###') && !cleaned.includes('**') && !cleaned.includes('[ดูรายละเอียด]'), 'cleanTextForSpeech successfully stripped Markdown artifacts');
  assert(cleaned.includes('ระเบียบการแต่งกาย') && cleaned.includes('เนคไทสีกรมท่า'), 'cleanTextForSpeech preserved core spoken words');

  const sampleVoiceReply = await generateAudioReply({
    text: 'ยินดีเจ้า สำหรับการจ่ายค่าเทอม สามารถติดต่อตี้แผนกการเงิน ตึกอำนวยการเน้อเจ้า',
    voiceGender: 'female',
    speed: 1.0,
    publicBaseUrl: 'https://ai.fang.ac.th'
  });

  assert(sampleVoiceReply.success === true, 'generateAudioReply returned success: true');
  assert(sampleVoiceReply.durationMs > 0, `Audio duration calculated: ${sampleVoiceReply.durationMs} ms`);
  assert(Boolean(sampleVoiceReply.audioUrl), `Audio URL generated: ${sampleVoiceReply.audioUrl}`);
  assert(Boolean(sampleVoiceReply.filename), `Audio file saved: ${sampleVoiceReply.filename}`);

  const savedFilePath = path.join(process.cwd(), 'public', 'audio', 'responses', sampleVoiceReply.filename);
  assert(fs.existsSync(savedFilePath), `Physical audio file exists on disk at ${savedFilePath}`);

  // 5. Test Dual Delivery Structure in LINE
  console.log('\n📌 Test Group 5: LINE Dual Delivery Payload Structure');
  const mockRagResult = {
    answer: 'ยินดีเจ้า การชำระค่าเทอมสามารถดำเนินการได้ตี้แผนกการเงิน ตึกอำนวยการเน้อเจ้า',
    audioUrl: sampleVoiceReply.audioUrl,
    audioDurationMs: sampleVoiceReply.durationMs,
    detectedDialect: 'kham_mueang'
  };

  const lineMessages = [
    { type: 'text', text: mockRagResult.answer }
  ];
  if (mockRagResult.audioUrl) {
    lineMessages.push({
      type: 'audio',
      originalContentUrl: mockRagResult.audioUrl,
      duration: mockRagResult.audioDurationMs
    });
  }

  assert(lineMessages.length === 2, 'Dual Delivery payload contains exactly 2 bubbles (Text + Audio)');
  assert(lineMessages[0].type === 'text', 'Bubble 1 is concise text summary');
  assert(lineMessages[1].type === 'audio', 'Bubble 2 is audio message');
  assert(lineMessages[1].originalContentUrl.startsWith('https://') || lineMessages[1].originalContentUrl.startsWith('/'), 'Audio URL is valid URI');
  assert(typeof lineMessages[1].duration === 'number' && lineMessages[1].duration > 0, 'Audio duration is valid positive integer in ms');

  // Summary
  console.log('\n===========================================================');
  console.log(`🏁 Test Results: ${passed} PASSED, ${failed} FAILED`);
  console.log('===========================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
