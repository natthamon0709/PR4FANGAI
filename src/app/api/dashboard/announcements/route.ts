import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const announcements = db.prepare(`
      SELECT 
        a.*,
        d.name as department_name,
        (u.first_name || ' ' || u.last_name) as author_name
      FROM announcements a
      LEFT JOIN departments d ON a.department_id = d.department_id
      LEFT JOIN master_users u ON a.author_user_id = u.user_id
      WHERE a.department_id IS NULL OR a.department_id = ?
      ORDER BY CASE WHEN a.priority = 'urgent' THEN 1 ELSE 2 END, a.created_at DESC
    `).all(session.department_id || '');

    return NextResponse.json({ announcements });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
