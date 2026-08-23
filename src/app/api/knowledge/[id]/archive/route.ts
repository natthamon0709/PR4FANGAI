import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';

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
    const knowledgeId = params.id;
    const item = db.prepare('SELECT * FROM knowledge_items WHERE knowledge_id = ?').get(knowledgeId) as any;

    if (!item) {
      return NextResponse.json({ error: 'ไม่พบรายการนี้' }, { status: 404 });
    }

    const isAdmin = session.role === 'administrator';
    if (!isAdmin && item.department_id !== session.department_id) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์จัดการข้อมูลของฝ่ายอื่น' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const newStatus = body.status === 'published' ? 'published' : 'archived';

    db.prepare(`
      UPDATE knowledge_items 
      SET status = ?, sync_status = 'pending', updated_at = datetime('now', 'localtime')
      WHERE knowledge_id = ?
    `).run(newStatus, knowledgeId);

    db.prepare('DELETE FROM dashboard_summary_cache').run();

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: newStatus === 'archived' 
        ? 'เก็บองค์ความรู้เข้าคลังเก็บถาวรเรียบร้อยแล้ว (AI จะหยุดใช้ข้อมูลนี้ตอบคำถามทันที)'
        : 'เผยแพร่องค์ความรู้นี้อีกครั้งเรียบร้อยแล้ว'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
