import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { exportUsersForGoogleSheets } from '@/lib/integrations';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const exportData = exportUsersForGoogleSheets();
    return NextResponse.json({
      mode: 'direct_database_export',
      ...exportData
    });
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'ระบบเชื่อมต่อตรงกับฐานข้อมูลหลักแล้ว ข้อมูลถูกจัดเก็บอย่างปลอดภัยใน SQLite',
    mode: 'direct_database'
  });
}
