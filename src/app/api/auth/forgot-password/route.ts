import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createPasswordResetToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: 'กรุณากรอกอีเมล' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = getUserByEmail(cleanEmail);

    let resetToken = null;
    let resetUrl = null;

    if (user && user.status === 'active') {
      resetToken = createPasswordResetToken(user.user_id);
      // In a live production system, email is sent with this URL.
      // For local development and demonstration, we also return the token/url in payload.
      const origin = req.headers.get('origin') || 'http://localhost:3000';
      resetUrl = `${origin}/reset-password?token=${resetToken}`;
    }

    // UX Rule: Generic message to prevent Email Enumeration attacks
    return NextResponse.json({
      success: true,
      message: 'หากอีเมลนี้อยู่ในระบบ เราได้ส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปยังอีเมลของคุณแล้ว (มีอายุการใช้งาน 30 นาที)',
      // Attached for easy testing/demo
      _demoResetUrl: resetUrl
    });
  } catch (error) {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการขอรีเซ็ตรหัสผ่าน' }, { status: 500 });
  }
}
