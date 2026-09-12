import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    message: 'ระบบทำงานบนฐานข้อมูล SQLite โดยตรง ไม่ต้องดึงข้อมูลผ่านชีทภายนอก',
    synced_at: new Date().toISOString(),
    results: {}
  });
}
