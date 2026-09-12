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

    const isAdmin = session.role === 'administrator';

    // 1. Try Supabase
    try {
      let query = supabaseAdmin
        .from('knowledge_gap_logs')
        .select('*, departments(name)')
        .eq('status', 'open');

      if (!isAdmin && session.department_id) {
        query = query.or(`department_guess.eq.${session.department_id},department_guess.is.null`);
      }

      const { data: sbGaps, error: sbErr } = await query
        .order('ask_count', { ascending: false })
        .order('last_asked_at', { ascending: false });

      if (!sbErr && sbGaps) {
        const formatted = sbGaps.map(g => ({
          ...g,
          department_name: (g.departments as any)?.name || null
        }));
        return NextResponse.json({ gaps: formatted });
      }
    } catch {}

    // 2. Fallback to SQLite
    const db = getDb();
    const gaps = isAdmin
      ? db.prepare(`
          SELECT g.*, d.name as department_name 
          FROM knowledge_gap_logs g 
          LEFT JOIN departments d ON g.department_guess = d.department_id
          WHERE g.status = 'open'
          ORDER BY g.ask_count DESC, g.last_asked_at DESC
        `).all()
      : db.prepare(`
          SELECT g.*, d.name as department_name 
          FROM knowledge_gap_logs g 
          LEFT JOIN departments d ON g.department_guess = d.department_id
          WHERE g.status = 'open' AND (g.department_guess = ? OR g.department_guess IS NULL)
          ORDER BY g.ask_count DESC, g.last_asked_at DESC
        `).all(session.department_id);

    return NextResponse.json({ gaps });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
