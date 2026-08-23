import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden: Administrator only' }, { status: 403 });
    }

    const db = getDb();
    const rows = db.prepare(`
      SELECT 
        s.*,
        u.first_name || ' ' || u.last_name as creator_name
      FROM scheduled_report_configs s
      LEFT JOIN master_users u ON s.created_by = u.user_id
      ORDER BY s.created_at DESC
    `).all() as any[];

    const schedules = rows.map(r => ({
      ...r,
      recipients: JSON.parse(r.recipients || '[]'),
      is_active: Boolean(r.is_active)
    }));

    return NextResponse.json({ schedules });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden: Administrator only' }, { status: 403 });
    }

    const body = await req.json();
    const { report_type = 'ai_performance', frequency = 'monthly', recipients = [], format = 'pdf', is_active = true } = body;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'กรุณาระบุผู้รับรายงานอย่างน้อย 1 รายการ' }, { status: 400 });
    }

    const db = getDb();
    const configId = 'sched-' + crypto.randomUUID();

    db.prepare(`
      INSERT INTO scheduled_report_configs (
        config_id, report_type, frequency, recipients, format, is_active, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `).run(
      configId,
      report_type,
      frequency,
      JSON.stringify(recipients),
      format,
      is_active ? 1 : 0,
      session.user_id
    );

    return NextResponse.json({ success: true, config_id: configId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
