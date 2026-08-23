import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, getUserById, verifyPassword, hashPassword } from '@/lib/auth';
import getDb from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const { currentPassword, newPassword, confirmPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' }, { status: 400 });
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json({ error: 'รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน' }, { status: 400 });
    }

    const user = getUserById(session.user_id);
    if (!user) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลผู้ใช้งาน' }, { status: 404 });
    }

    const isMatch = await verifyPassword(currentPassword, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' }, { status: 400 });
    }

    const newHash = await hashPassword(newPassword);
    const db = getDb();
    db.prepare(`
      UPDATE master_users
      SET password_hash = ?, updated_at = datetime('now', 'localtime')
      WHERE user_id = ?
    `).run(newHash, session.user_id);

    return NextResponse.json({
      success: true,
      message: 'เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว'
    });
  } catch (error) {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' }, { status: 500 });
  }
}
