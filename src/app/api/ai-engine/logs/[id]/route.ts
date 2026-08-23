import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const db = getDb();
    const logId = params.id;

    const log = db.prepare(`
      SELECT 
        q.log_id,
        q.line_user_id,
        q.matched_user_id,
        (u.first_name || ' ' || u.last_name) as matched_user_name,
        u.email as matched_user_email,
        u.role as matched_user_role,
        q.question_text,
        q.confidence_score,
        q.answer_text,
        q.is_fallback,
        q.response_time_ms,
        q.feedback,
        q.department_id,
        d.name as department_name,
        q.created_at,
        EXISTS(SELECT 1 FROM knowledge_gap_logs g WHERE g.query_text = q.question_text) as is_marked_gap
      FROM ai_query_logs q
      LEFT JOIN master_users u ON q.matched_user_id = u.user_id
      LEFT JOIN departments d ON q.department_id = d.department_id
      WHERE q.log_id = ?
    `).get(logId) as any;

    if (!log) {
      return NextResponse.json({ error: 'ไม่พบบันทึกการสนทนา' }, { status: 404 });
    }

    // Role Scoping: Staff can only access queries of their department
    if (session.role !== 'administrator' && log.department_id && log.department_id !== session.department_id && log.matched_user_id !== session.user_id) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึงบันทึกการสนทนานี้' }, { status: 403 });
    }

    // Fetch Retrieved Sources
    const sources = db.prepare(`
      SELECT 
        s.source_id,
        s.log_id,
        s.knowledge_id,
        k.title,
        k.summary,
        k.content,
        k.content_type,
        d.name as department_name,
        s.relevance_score,
        s.rank
      FROM ai_retrieved_sources s
      JOIN knowledge_items k ON s.knowledge_id = k.knowledge_id
      LEFT JOIN departments d ON k.department_id = d.department_id
      WHERE s.log_id = ?
      ORDER BY s.rank ASC
    `).all(logId);

    return NextResponse.json({
      log: {
        ...log,
        is_fallback: Boolean(log.is_fallback),
        is_marked_gap: Boolean(log.is_marked_gap),
        confidence_score: Number(log.confidence_score),
        sources
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
