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
    const search = searchParams.get('search')?.trim() || '';
    const deptFilter = searchParams.get('department_id') || 'all';
    const confidenceFilter = searchParams.get('confidence') || 'all';
    const feedbackFilter = searchParams.get('feedback') || 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    const isAdmin = session.role === 'administrator';

    let query = `
      SELECT 
        q.log_id,
        q.line_user_id,
        q.matched_user_id,
        (u.first_name || ' ' || u.last_name) as matched_user_name,
        q.question_text,
        q.confidence_score,
        q.answer_text,
        q.is_fallback,
        q.response_time_ms,
        q.feedback,
        q.department_id,
        d.name as department_name,
        q.created_at,
        EXISTS(SELECT 1 FROM knowledge_gap_logs g WHERE g.question_text = q.question_text) as is_marked_gap
      FROM ai_query_logs q
      LEFT JOIN master_users u ON q.matched_user_id = u.user_id
      LEFT JOIN departments d ON q.department_id = d.department_id
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    // Staff Scoping: Staff can only see their department's queries
    if (!isAdmin) {
      conditions.push('(q.department_id = ? OR q.matched_user_id = ?)');
      params.push(session.department_id, session.user_id);
    } else if (deptFilter !== 'all') {
      conditions.push('q.department_id = ?');
      params.push(deptFilter);
    }

    if (search) {
      conditions.push('(q.question_text LIKE ? OR q.answer_text LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (confidenceFilter === 'high') {
      conditions.push('q.confidence_score >= 0.75');
    } else if (confidenceFilter === 'medium') {
      conditions.push('q.confidence_score >= 0.50 AND q.confidence_score < 0.75');
    } else if (confidenceFilter === 'low') {
      conditions.push('q.confidence_score < 0.50');
    }

    if (feedbackFilter !== 'all') {
      conditions.push('q.feedback = ?');
      params.push(feedbackFilter);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Count Total
    const countSql = `SELECT COUNT(*) as c FROM (${query})`;
    const totalCount = (db.prepare(countSql).get(...params) as any).c;

    query += ` ORDER BY q.created_at DESC LIMIT ? OFFSET ?`;
    const logs = db.prepare(query).all(...params, limit, offset) as any[];

    // Attach Top sources to each log
    const getSources = db.prepare(`
      SELECT 
        s.source_id,
        s.log_id,
        s.knowledge_id,
        k.title,
        k.content_type,
        s.relevance_score,
        s.rank
      FROM ai_retrieved_sources s
      JOIN knowledge_items k ON s.knowledge_id = k.knowledge_id
      WHERE s.log_id = ?
      ORDER BY s.rank ASC
    `);

    const formattedLogs = logs.map(l => ({
      ...l,
      is_fallback: Boolean(l.is_fallback),
      is_marked_gap: Boolean(l.is_marked_gap),
      confidence_score: Number(l.confidence_score),
      sources: getSources.all(l.log_id)
    }));

    return NextResponse.json({
      logs: formattedLogs,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit) || 1
      },
      is_admin: isAdmin
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
