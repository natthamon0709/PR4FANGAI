import { NextResponse } from 'next/server';
import { getActiveAiConfig } from '@/lib/rag-engine';
import getDb from '@/lib/db';

/**
 * Robot Reception System Status API
 * ตรวจสอบความพร้อมของ AI Engine, คลังความรู้ และระบบสังเคราะห์เสียง
 */
export async function GET() {
  try {
    const config = getActiveAiConfig();
    const db = getDb();

    // ดึงจำนวนเอกสารความรู้ที่เผยแพร่และเปิดให้ AI ค้นคืน
    let totalKnowledge = 0;
    try {
      const countRow = db.prepare(
        "SELECT COUNT(*) as cnt FROM knowledge_items WHERE status = 'published' AND is_ai_retrievable = 1"
      ).get() as { cnt: number } | undefined;
      totalKnowledge = countRow?.cnt || 0;
    } catch (e) {
      // fallback กรณี query มีข้อขัดข้อง
    }

    return NextResponse.json({
      online: true,
      ready: true,
      provider: config.provider,
      model: config.model_name,
      voiceEnabled: Boolean(config.voice_reply_enabled),
      voiceGender: config.voice_gender || 'female',
      voiceDialectMode: config.voice_dialect_mode || 'adaptive',
      confidenceThreshold: config.confidence_threshold,
      publishedKnowledgeCount: totalKnowledge,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        online: false,
        ready: false,
        error: error.message || 'ไม่สามารถตรวจสอบสถานะ AI Engine ได้'
      },
      { status: 500 }
    );
  }
}
