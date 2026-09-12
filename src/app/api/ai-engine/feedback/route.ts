import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import getDb from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { log_id, feedback } = body;

    if (!log_id || !['helpful', 'not_helpful', 'none'].includes(feedback)) {
      return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
    }

    // 1. Update in Supabase
    try {
      await supabaseAdmin
        .from('ai_query_logs')
        .update({ feedback })
        .eq('log_id', log_id);
    } catch {}

    // 2. Update in SQLite
    try {
      const db = getDb();
      db.prepare('UPDATE ai_query_logs SET feedback = ? WHERE log_id = ?').run(feedback, log_id);
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Recorded feedback successfully'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
