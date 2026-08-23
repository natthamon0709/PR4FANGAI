import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden: Administrator only' }, { status: 403 });
    }

    const body = await req.json();
    const db = getDb();

    if (body.is_active !== undefined) {
      db.prepare('UPDATE scheduled_report_configs SET is_active = ? WHERE config_id = ?').run(body.is_active ? 1 : 0, params.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden: Administrator only' }, { status: 403 });
    }

    const db = getDb();
    db.prepare('DELETE FROM scheduled_report_configs WHERE config_id = ?').run(params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
