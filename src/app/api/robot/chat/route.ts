import { NextRequest, NextResponse } from 'next/server';
import { executeRAGPipeline } from '@/lib/rag-engine';

/**
 * Robot Reception Playground Chat API
 * ออกแบบสำหรับเชื่อมต่อกับหน้าจอหุ่นยนต์ต้อนรับ (Robot Reception Kiosk)
 * ใช้งาน logic เดียวกับ AI Playground ทุกประการ โดยไม่ต้องผ่านการล็อกอิน
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, audioBase64, audioMimeType, generateVoiceReply, voiceGender } = body;

    // ตรวจสอบว่ามีข้อความคำถามหรือไฟล์เสียงส่งมาหรือไม่
    if ((!question || question.trim().length === 0) && !audioBase64) {
      return NextResponse.json(
        { error: 'กรุณาระบุข้อความคำถามหรือส่งเสียงพูด' },
        { status: 400 }
      );
    }

    let audioBuffer: Buffer | undefined;
    if (audioBase64) {
      try {
        const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');
        audioBuffer = Buffer.from(cleanBase64, 'base64');
      } catch (err) {
        console.error('Error decoding audio buffer in robot API:', err);
      }
    }

    // ประมวลผล RAG Pipeline เดียวกันกับระบบหลัก
    // โดยส่ง generateVoiceReply: true เป็นค่าเริ่มต้นเพื่อให้หุ่นยนต์สามารถพูดตอบกลับได้
    // และรองรับการเลือกเพศเสียง (หญิง/ชาย) จากหน้าหุ่นยนต์
    const result = await executeRAGPipeline({
      question: question?.trim() || '',
      audioBuffer,
      audioMimeType: audioMimeType || 'audio/webm',
      lineUserId: 'ROBOT_RECEPTION_CLIENT',
      isPlayground: true, // ไม่บันทึกทับซ้อนลง AI query logs หลัก
      generateVoiceReply: generateVoiceReply !== false,
      overrideVoiceGender: voiceGender === 'male' || voiceGender === 'female' ? voiceGender : undefined,
      publicBaseUrl: req.nextUrl.origin
    });

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error: any) {
    console.error('Robot Chat API Error:', error);
    return NextResponse.json(
      { error: error.message || 'เกิดข้อผิดพลาดในการประมวลผลคำตอบของหุ่นยนต์' },
      { status: 500 }
    );
  }
}
