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
    const status = searchParams.get('status') || 'all';

    let query = `
      SELECT 
        c.*,
        (u.first_name || ' ' || u.last_name) as resolver_name
      FROM sync_conflicts c
      LEFT JOIN master_users u ON c.resolved_by = u.user_id
    `;

    if (status !== 'all') {
      query += ` WHERE c.status = '${status}'`;
    }

    query += ` ORDER BY c.created_at DESC`;

    const conflicts = db.prepare(query).all().map((c: any) => ({
      ...c,
      db_value: JSON.parse(c.db_value || '{}'),
      sheet_value: JSON.parse(c.sheet_value || '{}'),
    }));

    return NextResponse.json({
      conflicts,
      total: conflicts.length,
      unresolved_count: conflicts.filter(c => c.status === 'unresolved').length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
