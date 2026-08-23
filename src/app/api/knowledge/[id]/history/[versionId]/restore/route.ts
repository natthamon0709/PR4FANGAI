import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';
import crypto from 'crypto';

interface RouteParams {
  params: { id: string; versionId: string };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const db = getDb();
    const knowledgeId = params.id;
    const versionId = params.versionId;

    const currentItem = db.prepare('SELECT * FROM knowledge_items WHERE knowledge_id = ?').get(knowledgeId) as any;
    if (!currentItem) {
      return NextResponse.json({ error: 'ไม่พบองค์ความรู้นี้' }, { status: 404 });
    }

    const isAdmin = session.role === 'administrator';
    if (!isAdmin && currentItem.department_id !== session.department_id) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์กู้คืนข้อมูลของฝ่ายอื่น' }, { status: 403 });
    }

    const targetVersion = db.prepare('SELECT * FROM knowledge_version_history WHERE version_id = ? AND knowledge_id = ?').get(versionId, knowledgeId) as any;
    if (!targetVersion) {
      return NextResponse.json({ error: 'ไม่พบประวัติเวอร์ชันที่ต้องการกู้คืน' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const maxVersionRow = db.prepare('SELECT MAX(version_no) as max_v FROM knowledge_version_history WHERE knowledge_id = ?').get(knowledgeId) as { max_v: number };
    const nextVersionNo = (maxVersionRow?.max_v || 1) + 1;

    const transaction = db.transaction(() => {
      // 1. Create a new version snapshot recording the rollback action
      db.prepare(`
        INSERT INTO knowledge_version_history (
          version_id, knowledge_id, version_no, title_snapshot, summary_snapshot,
          content_snapshot, tags_snapshot, edited_by, edited_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'ver-' + crypto.randomUUID(),
        knowledgeId,
        nextVersionNo,
        `[กู้คืนจาก v${targetVersion.version_no}] ` + targetVersion.title_snapshot,
        targetVersion.summary_snapshot,
        targetVersion.content_snapshot,
        targetVersion.tags_snapshot,
        session.user_id,
        now
      );

      // 2. Overwrite knowledge_items with the restored version
      db.prepare(`
        UPDATE knowledge_items SET
          title = ?,
          summary = ?,
          content = ?,
          tags = ?,
          sync_status = 'pending',
          updated_by = ?,
          updated_at = ?
        WHERE knowledge_id = ?
      `).run(
        targetVersion.title_snapshot,
        targetVersion.summary_snapshot,
        targetVersion.content_snapshot,
        targetVersion.tags_snapshot,
        session.user_id,
        now,
        knowledgeId
      );

      db.prepare('DELETE FROM dashboard_summary_cache').run();
    });

    transaction();

    return NextResponse.json({
      success: true,
      message: `กู้คืนข้อมูลกลับสู่เนื้อหาเวอร์ชัน v${targetVersion.version_no} เรียบร้อยแล้ว (บันทึกเป็น v${nextVersionNo})`
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'กู้คืนไม่สำเร็จ: ' + error.message }, { status: 500 });
  }
}
