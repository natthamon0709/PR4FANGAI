import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Administrator) เท่านั้น' }, { status: 403 });
    }

    // 1. Try Supabase
    try {
      const { data: sbLogs, error: sbErr } = await supabaseAdmin
        .from('login_audit_logs')
        .select(`
          *,
          master_users (
            first_name,
            last_name,
            role,
            departments (
              name
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!sbErr && sbLogs) {
        const formatted = sbLogs.map(l => ({
          log_id: l.log_id,
          user_id: l.user_id,
          email_attempted: l.email_attempted,
          result: l.result,
          ip_address: l.ip_address,
          created_at: l.created_at,
          first_name: (l.master_users as any)?.first_name || null,
          last_name: (l.master_users as any)?.last_name || null,
          role: (l.master_users as any)?.role || null,
          department_name: (l.master_users as any)?.departments?.name || null
        }));

        return NextResponse.json({ logs: formatted });
      }
    } catch {}

    // 2. Fallback to SQLite
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
