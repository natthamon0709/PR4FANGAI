import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';
import { executeBroadcastDispatch } from '@/lib/line-service';
import { pullLatestFromGoogleSheets } from '@/lib/google-sheets-sync';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    try {
      await pullLatestFromGoogleSheets('LINE_Broadcasts');
    } catch {}

    const db = getDb();
    const isAdmin = session.role === 'administrator';

    let query = `
      SELECT 
        b.broadcast_id,
        b.title,
        b.message_text,
        b.source_knowledge_id,
        k.title as source_knowledge_title,
        b.target_type,
        b.department_id,
        d.name as department_name,
        b.scheduled_at,
        b.status,
        b.delivered_count,
        b.created_by,
        (u.first_name || ' ' || u.last_name) as created_by_name,
        b.sent_at,
        b.created_at
      FROM line_broadcasts b
      LEFT JOIN knowledge_items k ON b.source_knowledge_id = k.knowledge_id
      LEFT JOIN departments d ON b.department_id = d.department_id
      LEFT JOIN master_users u ON b.created_by = u.user_id
    `;

    const params: any[] = [];
    if (!isAdmin) {
      query += ` WHERE b.department_id = ? OR b.created_by = ?`;
      params.push(session.department_id, session.user_id);
    }

    query += ` ORDER BY b.created_at DESC`;
    const broadcasts = db.prepare(query).all(...params);

    return NextResponse.json({ broadcasts, is_admin: isAdmin });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      message_text,
      source_knowledge_id,
      target_type = 'all_followers',
      department_id,
      scheduled_at,
      send_immediately = true
    } = body;

    if (!title || !message_text) {
      return NextResponse.json({ error: 'กรุณาระบุหัวข้อและข้อความประชาสัมพันธ์' }, { status: 400 });
    }

    // Role Scoping: Staff can only target their own department
    let finalTargetType = target_type;
    let finalDeptId = department_id;
    if (session.role !== 'administrator') {
      finalTargetType = 'linked_staff_department';
      finalDeptId = session.department_id;
    }

    const db = getDb();
    const broadcastId = 'bc-' + crypto.randomUUID();
    const status = send_immediately ? 'sent' : 'scheduled';

    db.prepare(`
      INSERT INTO line_broadcasts (
        broadcast_id, title, message_text, source_knowledge_id, target_type,
        department_id, scheduled_at, status, delivered_count, created_by, sent_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, datetime('now', 'localtime'))
    `).run(
      broadcastId,
      title.trim(),
      message_text.trim(),
      source_knowledge_id || null,
      finalTargetType,
      finalDeptId || null,
      scheduled_at || null,
      status,
      session.user_id,
      send_immediately ? new Date().toISOString() : null
    );

    let deliveredCount = 0;
    if (send_immediately) {
      const dispatchRes = await executeBroadcastDispatch(broadcastId);
      deliveredCount = dispatchRes.deliveredCount;
    }

    return NextResponse.json({
      success: true,
      message: send_immediately
        ? `ส่งข้อความประชาสัมพันธ์สำเร็จ (ส่งถึงผู้รับ ${deliveredCount.toLocaleString()} คน)`
        : 'ตั้งเวลาส่งข้อความประชาสัมพันธ์เรียบร้อยแล้ว',
      broadcast_id: broadcastId,
      delivered_count: deliveredCount
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
