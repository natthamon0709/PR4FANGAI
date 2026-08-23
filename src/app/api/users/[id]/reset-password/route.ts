import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, hashPassword, getUserById } from '@/lib/auth';
import getDb from '@/lib/db';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Administrator) เท่านั้น' }, { status: 403 });
    }

    const user = getUserById(params.id);
    if (!user) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้งาน' }, { status: 404 });
    }

    const tempPassword = `Fang@${Math.floor(1000 + Math.random() * 9000)}`;
    const newHash = await hashPassword(tempPassword);

    const db = getDb();
    db.prepare(`
      UPDATE master_users
      SET password_hash = ?, failed_login_count = 0, locked_until = NULL, updated_at = datetime('now', 'localtime')
      WHERE user_id = ?
    `).run(newHash, params.id);

    return NextResponse.json({
      success: true,
      message: `รีเซ็ตรหัสผ่านใหม่สำหรับ ${user.first_name} สำเร็จ`,
      tempPassword
    });
  } catch (error) {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน' }, { status: 500 });
  }
}
