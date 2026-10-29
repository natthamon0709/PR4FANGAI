import { NextResponse } from 'next/server';
import { getActiveAiConfig } from '@/lib/rag-engine';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Robot Reception System Status API
 * ตรวจสอบความพร้อมของ AI Engine, คลังความรู้ และระบบสังเคราะห์เสียง
 */
export async function GET() {
  try {
    let config = getActiveAiConfig();
    const db = getDb();

    // ดึงจำนวนเอกสารความรู้ที่เผยแพร่และเปิดให้ AI ค้นคืน
    let totalKnowledge = 0;

    // 1. ดึงจาก Supabase Cloud DB ก่อน (Production Primary)
    if (isSupabaseConfigured()) {
      try {
        const [sbCountRes, sbConfigRes] = await Promise.all([
          supabaseAdmin
            .from('knowledge_items')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'published')
            .eq('ai_retrieval_enabled', 1),
          supabaseAdmin
            .from('ai_engine_configs')
            .select('*')
            .eq('is_active', 1)
            .limit(1)
            .maybeSingle()
        ]);

        if (!sbCountRes.error && typeof sbCountRes.count === 'number') {
          totalKnowledge = sbCountRes.count;
        }

        if (!sbConfigRes.error && sbConfigRes.data) {
          const c = sbConfigRes.data;
          config = {
            ...config,
            provider: c.provider || config.provider,
            model_name: c.model_name || config.model_name,
            confidence_threshold: Number(c.confidence_threshold) || config.confidence_threshold,
            voice_reply_enabled: c.voice_reply_enabled !== undefined ? Boolean(c.voice_reply_enabled) : config.voice_reply_enabled,
            voice_gender: c.voice_gender || config.voice_gender,
            voice_dialect_mode: c.voice_dialect_mode || config.voice_dialect_mode,
            voice_speed: Number(c.voice_speed) || config.voice_speed
          };
        }
      } catch (sbErr) {
        console.warn('Failed to fetch robot status from Supabase:', sbErr);
      }
    }

    // 2. Fallback กรณีไม่ได้ต่อ Supabase หรือ Supabase ขัดข้อง ให้ดึงจาก SQLite ในตัว
    if (totalKnowledge === 0) {
      try {
        const countRow = db.prepare(
          "SELECT COUNT(*) as cnt FROM knowledge_items WHERE status = 'published' AND ai_retrieval_enabled = 1"
        ).get() as { cnt: number } | undefined;
        totalKnowledge = countRow?.cnt || 0;
      } catch (e) {
        // fallback กรณี query มีข้อขัดข้อง
      }
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
