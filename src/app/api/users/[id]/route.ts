import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { UserModel } from '@/models/user.model';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    // Staff can only view their own info, Admin can view anyone
    if (session.role !== 'administrator' && session.user_id !== params.id) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึงข้อมูลผู้ใช้งานรายนี้' }, { status: 403 });
    }

    const user = await UserModel.findUserById(params.id);
    if (!user) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้งานนี้ในระบบ' }, { status: 404 });
    }

    const { password_hash, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูล' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const body = await req.json();
    await UserModel.updateUser(params.id, body, session);

    return NextResponse.json({
      success: true,
      message: 'บันทึกการแก้ไขข้อมูลผู้ใช้งานเรียบร้อยแล้ว'
    });
  } catch (error: any) {
    const status = error.message?.includes('ไม่มีสิทธิ์') ? 403 : error.message?.includes('ไม่พบ') ? 404 : 500;
    return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้งาน' }, { status });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Administrator) เท่านั้น' }, { status: 403 });
    }

    await UserModel.deleteUser(params.id, session);

    return NextResponse.json({
      success: true,
      message: 'ลบบัญชีผู้ใช้งานเรียบร้อยแล้ว'
    });
  } catch (error: any) {
    const status = error.message?.includes('ไม่สามารถลบบัญชีของตนเอง') ? 400 : error.message?.includes('ไม่พบ') ? 404 : 500;
    return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาดในการลบบัญชีผู้ใช้งาน' }, { status });
  }
}
