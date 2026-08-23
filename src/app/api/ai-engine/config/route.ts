import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';
import { encryptApiKey, maskApiKey } from '@/lib/ai-crypto';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

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
      temperature = 0.3
    } = body;

    if (!system_prompt || system_prompt.trim().length === 0) {
      return NextResponse.json({ error: 'กรุณาระบุ System Prompt' }, { status: 400 });
    }

    const thresholdNum = Math.max(0.0, Math.min(1.0, parseFloat(confidence_threshold) || 0.70));
    const topKNum = Math.max(1, Math.min(10, parseInt(retrieval_top_k) || 5));
    const tempNum = Math.max(0.0, Math.min(1.0, parseFloat(temperature) || 0.3));

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

    if (current) {
      db.prepare(`
        UPDATE ai_engine_configs
        SET provider = ?, model_name = ?, api_key_encrypted = ?, system_prompt = ?,
            confidence_threshold = ?, retrieval_top_k = ?, temperature = ?, updated_by = ?, updated_at = ?
        WHERE config_id = ?
      `).run(
        provider,
        model_name,
        finalEncryptedKey,
        system_prompt.trim(),
        thresholdNum,
        topKNum,
        tempNum,
        session.user_id,
        now,
        current.config_id
      );
    } else {
      db.prepare(`
        INSERT INTO ai_engine_configs (
          config_id, provider, model_name, api_key_encrypted, system_prompt,
          confidence_threshold, retrieval_top_k, temperature, is_active, updated_by, updated_at
        ) VALUES ('cfg-ai-001', ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `).run(
        provider,
        model_name,
        finalEncryptedKey,
        system_prompt.trim(),
        thresholdNum,
        topKNum,
        tempNum,
        session.user_id,
        now
      );
    }

    return NextResponse.json({
      success: true,
      message: `บันทึกการตั้งค่า AI Engine เรียบร้อยแล้ว${verificationNote} (มีผลทันที)`,
      config: {
        provider,
        model_name,
        api_key_masked: maskApiKey(finalEncryptedKey),
        system_prompt: system_prompt.trim(),
        confidence_threshold: thresholdNum,
        retrieval_top_k: topKNum,
        temperature: tempNum,
        updated_at: now
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
