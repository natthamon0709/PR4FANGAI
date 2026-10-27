import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { UserModel } from '@/models/user.model';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Administrator) เท่านั้น' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const departmentId = searchParams.get('departmentId') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const result = await UserModel.findUsers({
      search,
      departmentId,
      role,
      status,
      page,
      limit
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ error: error?.message || 'ไม่สามารถดึงข้อมูลรายชื่อผู้ใช้งานได้' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Administrator) เท่านั้น' }, { status: 403 });
    }

    const body = await req.json();
    const { 
      first_name, 
      last_name, 
      email, 
      phone, 
      department_id, 
      sub_department_id, 
      role = 'staff', 
      status = 'active', 
      line_user_id,
      password 
    } = body;

    if (!first_name || !last_name || !email || !department_id || !sub_department_id) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ชื่อ, นามสกุล, อีเมล, ฝ่าย, งาน)' }, { status: 400 });
    }

    const result = await UserModel.createUser({
      first_name,
      last_name,
      email,
      phone,
      department_id,
      sub_department_id,
      role,
      status,
      line_user_id,
      password
    });

    return NextResponse.json({
      success: true,
      message: 'สร้างบัญชีผู้ใช้งานเรียบร้อยแล้ว',
      user: {
        ...result.user,
        tempPassword: result.tempPassword
      }
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    const status = error.message?.includes('มีผู้ใช้งานในระบบแล้ว') ? 409 : 500;
    return NextResponse.json({ error: error.message || 'เกิดข้อผิดพลาดในการสร้างบัญชีผู้ใช้งาน' }, { status });
  }
}
