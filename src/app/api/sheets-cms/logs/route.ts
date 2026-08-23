import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const db = getDb();
    const { searchParams } = new URL(req.url);
    const sheetName = searchParams.get('sheet_name') || 'all';
    const status = searchParams.get('status') || 'all';

    let query = 'SELECT * FROM sync_logs';
    const conditions: string[] = [];
    const params: any[] = [];

    if (sheetName !== 'all') {
      conditions.push('(sheet_name = ? OR LOWER(sheet_name) = ?)');
      params.push(sheetName, sheetName.toLowerCase());
    }
    if (status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY synced_at DESC LIMIT 50';

    const logs = db.prepare(query).all(...params);

    return NextResponse.json({
      logs,
      total: logs.length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
