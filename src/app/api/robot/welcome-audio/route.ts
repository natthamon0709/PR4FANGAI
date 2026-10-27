import { NextRequest, NextResponse } from 'next/server';
import { generateAudioReply } from '@/lib/tts-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const genderParam = searchParams.get('gender') || 'female';
    const voiceGender: 'female' | 'male' = genderParam === 'male' ? 'male' : 'female';

    const welcomeText = voiceGender === 'female'
      ? 'ยินดีต้อนรับสู่วิทยาลัยการอาชีพฝางค่ะ หนูคือหุ่นยนต์ผู้ช่วยประชาสัมพันธ์อัตโนมัติ สอบถามข้อมูลการเรียน แผนกวิชา หรือการสมัครเรียนได้เลยค่ะ แตะปุ่มไมโครโฟนเพื่อพูด หรือพิมพ์ข้อความคำถามได้เลยนะคะ'
      : 'ยินดีต้อนรับสู่วิทยาลัยการอาชีพฝางครับ ผมคือหุ่นยนต์ผู้ช่วยประชาสัมพันธ์อัตโนมัติ สอบถามข้อมูลการเรียน แผนกวิชา หรือการสมัครเรียนได้เลยครับ แตะปุ่มไมโครโฟนเพื่อพูด หรือพิมพ์ข้อความคำถามได้เลยครับ';

    const publicBaseUrl = req.nextUrl.origin;

    const audioRes = await generateAudioReply({
      text: welcomeText,
      voiceGender,
      speed: 1.0,
      dialect: 'central',
      publicBaseUrl
    });

    if (audioRes.success && audioRes.audioUrl) {
      return NextResponse.json({
        success: true,
        audioUrl: audioRes.audioUrl,
        durationMs: audioRes.durationMs,
        gender: voiceGender,
        diagnostic: audioRes.diagnostic
      });
    }

    return NextResponse.json({
      success: false,
      error: audioRes.error || 'ไม่สามารถสังเคราะห์เสียงต้อนรับได้'
    }, { status: 500 });
  } catch (err: any) {
    console.error('Welcome audio error:', err);
    return NextResponse.json({
      success: false,
      error: err.message || 'Internal error'
    }, { status: 500 });
  }
}
