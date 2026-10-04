import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import getDb from '@/lib/db';
import { encryptApiKey, maskApiKey } from '@/lib/ai-crypto';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    // 1. Try Supabase
    try {
      const { data: sbConfig, error: sbErr } = await supabaseAdmin
        .from('ai_engine_configs')
        .select('*')
        .eq('is_active', 1)
        .limit(1)
        .maybeSingle();

      if (!sbErr && sbConfig) {
        return NextResponse.json({
          config: {
            config_id: sbConfig.config_id,
            provider: sbConfig.provider,
            model_name: sbConfig.model_name,
            api_key_masked: maskApiKey(sbConfig.api_key_encrypted),
            system_prompt: sbConfig.system_prompt,
            confidence_threshold: Number(sbConfig.confidence_threshold),
            retrieval_top_k: Number(sbConfig.retrieval_top_k),
            temperature: Number(sbConfig.temperature),
            is_active: Boolean(sbConfig.is_active),
            updated_at: sbConfig.updated_at
          },
          is_admin: session.role === 'administrator'
        });
      }
    } catch {}

    // 2. Fallback to SQLite
    const db = getDb();
    const config = db.prepare('SELECT * FROM ai_engine_configs WHERE is_active = 1 LIMIT 1').get() as any;

    if (!config) {
      return NextResponse.json({ error: 'ไม่พบการตั้งค่า AI Engine' }, { status: 404 });
    }

    return NextResponse.json({
      config: {
        config_id: config.config_id,
        provider: config.provider,
        model_name: config.model_name,
        api_key_masked: maskApiKey(config.api_key_encrypted),
        system_prompt: config.system_prompt,
        confidence_threshold: Number(config.confidence_threshold),
        retrieval_top_k: Number(config.retrieval_top_k),
        temperature: Number(config.temperature),
        is_active: Boolean(config.is_active),
        voice_reply_enabled: config.voice_reply_enabled !== undefined ? Boolean(config.voice_reply_enabled) : true,
        voice_gender: config.voice_gender || 'female',
        voice_dialect_mode: config.voice_dialect_mode || 'adaptive',
        voice_speed: Number(config.voice_speed) || 1.0,
        updated_at: config.updated_at
      },
      is_admin: session.role === 'administrator'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    if (session.role !== 'administrator') {
      return NextResponse.json({ error: 'เฉพาะผู้ดูแลระบบ (Administrator) เท่านั้นที่สามารถแก้ไขการตั้งค่า AI ได้' }, { status: 403 });
    }

    const body = await req.json();
    const {
      provider = 'gemini',
      model_name = 'gemini-2.5-flash',
      api_key,
      system_prompt,
      confidence_threshold = 0.70,
      retrieval_top_k = 5,
      temperature = 0.3,
      voice_reply_enabled = true,
      voice_gender = 'female',
      voice_dialect_mode = 'adaptive',
      voice_speed = 1.0
    } = body;

    if (!system_prompt || system_prompt.trim().length === 0) {
      return NextResponse.json({ error: 'กรุณาระบุ System Prompt' }, { status: 400 });
    }

    const thresholdNum = Math.max(0.0, Math.min(1.0, parseFloat(confidence_threshold) || 0.70));
    const topKNum = Math.max(1, Math.min(10, parseInt(retrieval_top_k) || 5));
    const tempNum = Math.max(0.0, Math.min(1.0, parseFloat(temperature) || 0.3));
    const isVoiceEnabled = voice_reply_enabled === true || voice_reply_enabled === 1 || voice_reply_enabled === 'true';
    const cleanGender = voice_gender === 'male' ? 'male' : 'female';
    const cleanDialectMode = ['always_kham_mueang', 'always_central', 'adaptive'].includes(voice_dialect_mode) ? voice_dialect_mode : 'adaptive';
    const speedNum = Math.max(0.5, Math.min(2.0, parseFloat(voice_speed) || 1.0));

    const db = getDb();
    const current = db.prepare('SELECT * FROM ai_engine_configs WHERE is_active = 1 LIMIT 1').get() as any;

    let finalEncryptedKey = current?.api_key_encrypted || '';
    let verificationNote = '';

    if (api_key && api_key.trim().length > 0 && !api_key.includes('••••')) {
      const rawKey = api_key.trim();
      finalEncryptedKey = encryptApiKey(rawKey);

      // Verify key with provider
      if (provider === 'gemini') {
        try {
          const testRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${rawKey}`);
          if (!testRes.ok) {
            const errData = await testRes.json().catch(() => ({}));
            const errMsg = errData.error?.message || `HTTP ${testRes.status}`;
            return NextResponse.json({ 
              error: `❌ Google Gemini API Key ไม่ผ่านการตรวจสอบ: ${errMsg} (กรุณาตรวจสอบ API Key ที่ได้จาก Google AI Studio)` 
            }, { status: 400 });
          } else {
            verificationNote = ' (ผ่านการทดสอบเชื่อมต่อ Google Gemini สำเร็จ 100%)';
          }
        } catch (testErr: any) {
          console.warn('Gemini test connection warning:', testErr);
        }
      } else if (provider === 'openai') {
        try {
          const testRes = await fetch('https://api.openai.com/v1/models', {
            headers: { 'Authorization': `Bearer ${rawKey}` }
          });
          if (!testRes.ok) {
            return NextResponse.json({ 
              error: `❌ OpenAI API Key ไม่ผ่านการตรวจสอบ (HTTP ${testRes.status}) กรุณาตรวจสอบ API Key จาก OpenAI Platform` 
            }, { status: 400 });
          } else {
            verificationNote = ' (ผ่านการทดสอบเชื่อมต่อ OpenAI สำเร็จ 100%)';
          }
        } catch (testErr: any) {
          console.warn('OpenAI test connection warning:', testErr);
        }
      }
    }

    const now = new Date().toISOString();

    // 1. Update in Supabase
    try {
      await supabaseAdmin.from('ai_engine_configs').upsert({
        config_id: current?.config_id || 'cfg-ai-001',
        provider,
        model_name,
        api_key_encrypted: finalEncryptedKey,
        system_prompt: system_prompt.trim(),
        confidence_threshold: thresholdNum,
        retrieval_top_k: topKNum,
        temperature: tempNum,
        voice_reply_enabled: isVoiceEnabled ? 1 : 0,
        voice_gender: cleanGender,
        voice_dialect_mode: cleanDialectMode,
        voice_speed: speedNum,
        is_active: 1,
        updated_by: session.user_id,
        updated_at: now
      });
    } catch (sbErr) {
      console.warn('Supabase AI config update error:', sbErr);
    }

    // 2. Update in SQLite mirror
    try {
      if (current) {
        db.prepare(`
          UPDATE ai_engine_configs
          SET provider = ?, model_name = ?, api_key_encrypted = ?, system_prompt = ?,
              confidence_threshold = ?, retrieval_top_k = ?, temperature = ?,
              voice_reply_enabled = ?, voice_gender = ?, voice_dialect_mode = ?, voice_speed = ?,
              updated_by = ?, updated_at = ?
          WHERE config_id = ?
        `).run(
          provider,
          model_name,
          finalEncryptedKey,
          system_prompt.trim(),
          thresholdNum,
          topKNum,
          tempNum,
          isVoiceEnabled ? 1 : 0,
          cleanGender,
          cleanDialectMode,
          speedNum,
          session.user_id,
          now,
          current.config_id
        );
      } else {
        db.prepare(`
          INSERT INTO ai_engine_configs (
            config_id, provider, model_name, api_key_encrypted, system_prompt,
            confidence_threshold, retrieval_top_k, temperature,
            voice_reply_enabled, voice_gender, voice_dialect_mode, voice_speed,
            is_active, updated_by, updated_at
          ) VALUES ('cfg-ai-001', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        `).run(
          provider,
          model_name,
          finalEncryptedKey,
          system_prompt.trim(),
          thresholdNum,
          topKNum,
          tempNum,
          isVoiceEnabled ? 1 : 0,
          cleanGender,
          cleanDialectMode,
          speedNum,
          session.user_id,
          now
        );
      }
    } catch (dbErr) {
      console.error('SQLite AI config update error:', dbErr);
    }

    return NextResponse.json({
      success: true,
      message: `บันทึกการตั้งค่า AI Engine และระบบเสียงเรียบร้อยแล้ว${verificationNote} (มีผลทันที)`,
      config: {
        provider,
        model_name,
        api_key_masked: maskApiKey(finalEncryptedKey),
        system_prompt: system_prompt.trim(),
        confidence_threshold: thresholdNum,
        retrieval_top_k: topKNum,
        temperature: tempNum,
        voice_reply_enabled: isVoiceEnabled,
        voice_gender: cleanGender,
        voice_dialect_mode: cleanDialectMode,
        voice_speed: speedNum,
        updated_at: now
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
