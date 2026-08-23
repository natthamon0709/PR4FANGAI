import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { log_id, feedback } = body;

    if (!log_id || !['helpful', 'not_helpful', 'none'].includes(feedback)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    const db = getDb();
    const result = db.prepare('UPDATE ai_query_logs SET feedback = ? WHERE log_id = ?').run(feedback, log_id);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'Query log not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Recorded feedback successfully'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
