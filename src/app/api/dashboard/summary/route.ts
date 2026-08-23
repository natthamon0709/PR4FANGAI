import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { getDashboardSummary } from '@/lib/dashboard';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const refresh = searchParams.get('refresh') === 'true';

    const summary = await getDashboardSummary(session, refresh);
    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('Dashboard summary error:', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลสรุปแดชบอร์ดได้: ' + error.message }, { status: 500 });
  }
}
