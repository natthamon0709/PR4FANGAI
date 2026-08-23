import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Administrator) เท่านั้น' }, { status: 403 });
    }

    const db = getDb();
    const logs = db.prepare(`
      SELECT 
        l.*,
        u.first_name,
        u.last_name,
        u.role,
        d.name as department_name
      FROM login_audit_logs l
      LEFT JOIN master_users u ON l.user_id = u.user_id
      LEFT JOIN departments d ON u.department_id = d.department_id
      ORDER BY l.created_at DESC
      LIMIT 100
    `).all();

    return NextResponse.json({ logs });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch audit logs' }, { status: 500 });
  }
}
