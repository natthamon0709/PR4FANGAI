import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSystemSetting } from '@/lib/integrations';

export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key') || req.headers.get('x-pr4fang-key');
    const configuredKey = getSystemSetting('n8n_api_key', 'fang_ai_n8n_live_sec_key_2026');

    if (!apiKey || apiKey !== configuredKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const users = db.prepare(`
      SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.status,
        u.line_user_id,
        d.name as department_name,
        s.name as sub_department_name
      FROM master_users u
      LEFT JOIN departments d ON u.department_id = d.department_id
      LEFT JOIN sub_departments s ON u.sub_department_id = s.sub_department_id
      WHERE u.status = 'active'
    `).all();

    return NextResponse.json({ users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
