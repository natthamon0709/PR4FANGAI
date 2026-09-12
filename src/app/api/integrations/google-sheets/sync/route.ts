import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'ระบบเชื่อมต่อตรงกับฐานข้อมูลหลักแล้ว (Google Sheets Sync Disconnected)',
    mode: 'direct_database',
    syncedAt: new Date().toISOString()
  });
}
