import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { createSubDepartment } from '@/lib/settings-service';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden: Administrator only' }, { status: 403 });
    }

    const body = await req.json();
    const { department_id, name, code, display_order } = body;
    if (!department_id || !name || !code) {
      return NextResponse.json({ error: 'กรุณาระบุฝ่าย สังกัดชื่องาน และรหัสงาน' }, { status: 400 });
    }

    const created = createSubDepartment({ department_id, name, code, display_order }, session.user_id);
    return NextResponse.json({ success: true, sub_department: created });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
