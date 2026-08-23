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
    const isAdmin = session.role === 'administrator';

    // Auto-resolve any gaps that have published knowledge items
    try {
      db.prepare(`
        UPDATE knowledge_gap_logs 
        SET status = 'resolved' 
        WHERE status = 'open' 
        AND EXISTS (
          SELECT 1 FROM knowledge_items k 
          WHERE k.status = 'published' 
          AND (
            LOWER(k.title) = LOWER(knowledge_gap_logs.question_text)
            OR LOWER(k.title) LIKE '%' || LOWER(knowledge_gap_logs.question_text) || '%'
            OR LOWER(knowledge_gap_logs.question_text) LIKE '%' || LOWER(k.title) || '%'
          )
        )
      `).run();
    } catch {}

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
