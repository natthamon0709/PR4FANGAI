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

    if (session.role !== 'administrator') {
      return NextResponse.json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถแก้ไขข้อขัดแย้งได้' }, { status: 403 });
    }

    const db = getDb();
    const conflictId = params.id;
    const body = await req.json();
    const { choice } = body; // 'use_db' | 'use_sheet'

    if (!['use_db', 'use_sheet'].includes(choice)) {
      return NextResponse.json({ error: 'กรุณาระบุทางเลือก use_db หรือ use_sheet' }, { status: 400 });
    }

    const conflict = db.prepare('SELECT * FROM sync_conflicts WHERE conflict_id = ?').get(conflictId) as any;
    if (!conflict) {
      return NextResponse.json({ error: 'ไม่พบรายการข้อขัดแย้งนี้' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const dbValue = JSON.parse(conflict.db_value || '{}');
    const sheetValue = JSON.parse(conflict.sheet_value || '{}');

    const transaction = db.transaction(() => {
      // If user chose sheet value, apply sheet value into database
      if (choice === 'use_sheet') {
        if (conflict.sheet_name === 'knowledge') {
          db.prepare(`
            UPDATE knowledge_items SET
              title = ?,
              summary = ?,
              content = ?,
              sync_status = 'synced',
              updated_by = ?,
              updated_at = ?
            WHERE knowledge_id = ?
          `).run(
            sheetValue.title || dbValue.title,
            sheetValue.summary || dbValue.summary,
            sheetValue.content || dbValue.content,
            session.user_id,
            now,
            conflict.record_id
          );
        } else if (conflict.sheet_name === 'master_users') {
          db.prepare(`
            UPDATE master_users SET
              phone = ?,
              updated_at = ?
            WHERE user_id = ?
          `).run(
            sheetValue.phone || dbValue.phone,
            now,
            conflict.record_id
          );
        }
      }

      // Mark Conflict as Resolved
      db.prepare(`
        UPDATE sync_conflicts SET
          status = ?,
          resolved_by = ?,
          resolved_at = ?
        WHERE conflict_id = ?
      `).run(
        choice === 'use_db' ? 'resolved_use_db' : 'resolved_use_sheet',
        session.user_id,
        now,
        conflictId
      );

      // Record in Sync Logs
      db.prepare(`
        INSERT INTO sync_logs (log_id, sheet_name, direction, row_reference, status, error_message, synced_at)
        VALUES (?, ?, 'two_way', ?, 'success', ?, ?)
      `).run(
        'slog-' + crypto.randomUUID(),
        conflict.sheet_name,
        `แก้ไขข้อขัดแย้ง: ${conflict.record_title}`,
        `แก้ไขโดยเลือก: ${choice === 'use_db' ? 'ใช้ค่าปัจจุบันในระบบ' : 'ใช้ค่าที่แก้ไขใน Google Sheet'}`,
        now
      );

      db.prepare('DELETE FROM dashboard_summary_cache').run();
    });

    transaction();

    return NextResponse.json({
      success: true,
      message: `แก้ไขข้อขัดแย้งเรียบร้อยแล้ว โดยกำหนดให้ "${choice === 'use_db' ? 'ใช้ค่าจากระบบ' : 'ใช้ค่าจาก Google Sheet'}"`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
