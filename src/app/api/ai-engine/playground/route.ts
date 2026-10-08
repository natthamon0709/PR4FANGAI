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
    const { question, audioBase64, audioMimeType, includeDrafts } = body;

    if ((!question || question.trim().length === 0) && !audioBase64) {
      return NextResponse.json({ error: 'กรุณาระบุข้อความคำถามหรือบันทึกเสียง' }, { status: 400 });
    }

    let audioBuffer: Buffer | undefined;
    if (audioBase64) {
      try {
        const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');
        audioBuffer = Buffer.from(cleanBase64, 'base64');
      } catch (err) {
        console.error('Error decoding audio buffer in playground:', err);
      }
    }

    const isAudioInput = Boolean(audioBuffer && audioBuffer.length > 0);

    // Execute in playground mode (ตรงตามการทำงานฝั่ง LINE OA: ถามเสียงตอบเสียง ถามพิมพ์ตอบพิมพ์)
    const result = await executeRAGPipeline({
      question: question?.trim() || '',
      audioBuffer,
      audioMimeType: audioMimeType || 'audio/webm',
      isPlayground: true,
      includeDrafts: Boolean(includeDrafts),
      generateVoiceReply: isAudioInput, // ถ้าถามเสียงตอบเสียง ถ้าพิมพ์ตอบเฉพาะข้อความ
      publicBaseUrl: req.nextUrl.origin
    });

    return NextResponse.json({
      success: true,
      result
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
