import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';
import crypto from 'crypto';

interface RouteParams {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const db = getDb();
    const logId = params.id;

    const log = db.prepare('SELECT * FROM ai_query_logs WHERE log_id = ?').get(logId) as any;
    if (!log) {
      return NextResponse.json({ error: 'ไม่พบบันทึกการสนทนา' }, { status: 404 });
    }

    // Role Scoping: Staff can only mark gaps for their own department's scope
    if (session.role !== 'administrator' && log.department_id && log.department_id !== session.department_id) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์ทำเครื่องหมายเป็น Knowledge Gap สำหรับฝ่ายอื่น' }, { status: 403 });
    }

    const existingGap = db.prepare('SELECT gap_id, ask_count FROM knowledge_gap_logs WHERE question_text = ? LIMIT 1').get(log.question_text) as any;

    if (existingGap) {
      db.prepare(`
        UPDATE knowledge_gap_logs 
        SET ask_count = ask_count + 1, last_asked_at = datetime('now', 'localtime') 
        WHERE gap_id = ?
      `).run(existingGap.gap_id);
    } else {
      const gapId = 'gap-' + crypto.randomUUID();
      db.prepare(`
        INSERT INTO knowledge_gap_logs (gap_id, question_text, ask_count, status, department_guess, last_asked_at)
        VALUES (?, ?, 1, 'open', ?, datetime('now', 'localtime'))
      `).run(gapId, log.question_text, log.department_id || null);
    }

    return NextResponse.json({
      success: true,
      message: 'ทำเครื่องหมายเป็น Knowledge Gap เรียบร้อยแล้ว (จะปรากฏในแดชบอร์ดเพื่อปรับปรุงองค์ความรู้)'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
