import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getDashboardSummary } from '@/lib/dashboard';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const summary = await getDashboardSummary(session, true);
    return NextResponse.json({
      success: true,
      message: 'รีเฟรชข้อมูลแดชบอร์ดเรียบร้อยแล้ว',
      summary
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการรีเฟรชข้อมูล: ' + error.message }, { status: 500 });
  }
}
