import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Try Supabase
    try {
      let query = supabaseAdmin
        .from('announcements')
        .select(`
          *,
          departments (name),
          master_users (first_name, last_name)
        `);

      if (session.department_id) {
        query = query.or(`department_id.is.null,department_id.eq.${session.department_id}`);
      }

      const { data: sbAnnouncements, error: sbErr } = await query
        .order('created_at', { ascending: false });

      if (!sbErr && sbAnnouncements) {
        const formatted = sbAnnouncements.map(a => ({
          announcement_id: a.announcement_id,
          title: a.title,
          content: a.content,
          priority: a.priority,
          department_id: a.department_id,
          author_user_id: a.author_user_id,
          created_at: a.created_at,
          department_name: (a.departments as any)?.name || null,
          author_name: (a.master_users as any) ? `${(a.master_users as any).first_name} ${(a.master_users as any).last_name}` : ''
        }));

        // Sort urgent first
        formatted.sort((x, y) => (x.priority === 'urgent' ? -1 : 1));

        return NextResponse.json({ announcements: formatted });
      }
    } catch {}

    // 2. Fallback to SQLite
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
