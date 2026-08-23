import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { executeRAGPipeline } from '@/lib/rag-engine';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const body = await req.json();
    const { question } = body;

    if (!question || question.trim().length === 0) {
      return NextResponse.json({ error: 'กรุณาระบุข้อความคำถาม' }, { status: 400 });
    }

    // Execute in playground mode (does not persist to actual ai_query_logs)
    const result = await executeRAGPipeline({
      question: question.trim(),
      isPlayground: true
    });

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
