import { NextRequest, NextResponse } from 'next/server';
import { hashPassword, verifyPasswordResetToken, consumePasswordResetToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword, confirmPassword } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'ไม่พบโทเค็นสำหรับการรีเซ็ตรหัสผ่าน' }, { status: 400 });
    }

    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน' }, { status: 400 });
    }

    const verification = verifyPasswordResetToken(token);
    if (!verification.valid) {
      return NextResponse.json({ error: verification.error || 'โทเค็นไม่ถูกต้องหรือหมดอายุ' }, { status: 400 });
    }

    const passwordHash = await hashPassword(newPassword);
    const success = consumePasswordResetToken(token, passwordHash);

    if (!success) {
      return NextResponse.json({ error: 'ไม่สามารถเปลี่ยนรหัสผ่านได้ กรุณาลองใหม่อีกครั้ง' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'ตั้งรหัสผ่านใหม่สำเร็จแล้ว สามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที'
    });
  } catch (error) {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการตั้งรหัสผ่านใหม่' }, { status: 500 });
  }
}
