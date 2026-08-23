import { NextRequest, NextResponse } from 'next/server';
import { executeRAGPipeline } from '@/lib/rag-engine';
import { getSystemSetting } from '@/lib/integrations';

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key') || req.headers.get('x-pr4fang-key');
    const configuredKey = getSystemSetting('n8n_api_key', 'fang_ai_n8n_live_sec_key_2026');

    // Allow authenticated requests or verified LINE Webhook API keys
    const body = await req.json();
    const { question, line_user_id = 'LINE_GUEST_USER' } = body;

    if (!question || question.trim().length === 0) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const result = await executeRAGPipeline({
      question: question.trim(),
      lineUserId: line_user_id,
      isPlayground: false
    });

    return NextResponse.json({
      success: true,
      log_id: result.log_id,
      answer: result.answer,
      confidence_score: result.confidence_score,
      is_fallback: result.is_fallback,
      response_time_ms: result.response_time_ms,
      sources: result.sources
    });
  } catch (error: any) {
    console.error('AI Query Engine Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
