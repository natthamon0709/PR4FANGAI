import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';
import crypto from 'crypto';

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const db = getDb();
    const knowledgeId = params.id;

    // Fetch Item
    const item = db.prepare(`
      SELECT 
        k.*,
        (SELECT COUNT(*) FROM ai_retrieved_sources s JOIN ai_query_logs q ON s.log_id = q.log_id WHERE s.knowledge_id = k.knowledge_id AND q.is_fallback = 0) as ai_reference_count,
        d.name as department_name,
        s.name as sub_department_name,
        (u.first_name || ' ' || u.last_name) as creator_name,
        (u2.first_name || ' ' || u2.last_name) as updater_name,
        (SELECT COUNT(*) FROM knowledge_version_history v WHERE v.knowledge_id = k.knowledge_id) as version_count
      FROM knowledge_items k
      LEFT JOIN departments d ON k.department_id = d.department_id
      LEFT JOIN sub_departments s ON k.sub_department_id = s.sub_department_id
      LEFT JOIN master_users u ON k.created_by = u.user_id
      LEFT JOIN master_users u2 ON k.updated_by = u2.user_id
      WHERE k.knowledge_id = ?
    `).get(knowledgeId) as any;

    if (!item) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลองค์ความรู้นี้' }, { status: 404 });
    }

    // Role check: Staff cannot view draft/archived items of other departments
    const isAdmin = session.role === 'administrator';
    if (!isAdmin && item.department_id !== session.department_id && item.status !== 'published') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึงข้อมูลร่างของฝ่ายอื่น' }, { status: 403 });
    }

    // Increment view_count
    db.prepare('UPDATE knowledge_items SET view_count = view_count + 1 WHERE knowledge_id = ?').run(knowledgeId);

    // Fetch Attachments
    const attachments = db.prepare(`
      SELECT * FROM knowledge_attachments WHERE knowledge_id = ? ORDER BY uploaded_at DESC
    `).all(knowledgeId);

    // Parse Tags
    let parsedTags: string[] = [];
    try {
      parsedTags = JSON.parse(item.tags || '[]');
    } catch (e) {
      parsedTags = item.tags ? [item.tags] : [];
    }

    return NextResponse.json({
      item: {
        ...item,
        tags: parsedTags,
        ai_retrieval_enabled: Boolean(item.ai_retrieval_enabled),
        attachments
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด: ' + error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const db = getDb();
    const knowledgeId = params.id;

    // Check existing item
    const existing = db.prepare('SELECT * FROM knowledge_items WHERE knowledge_id = ?').get(knowledgeId) as any;
    if (!existing) {
      return NextResponse.json({ error: 'ไม่พบรายการที่ต้องการแก้ไข' }, { status: 404 });
    }

    // Role Scoping: Staff can only edit their own department's items
    const isAdmin = session.role === 'administrator';
    if (!isAdmin && existing.department_id !== session.department_id) {
      return NextResponse.json({ error: 'คุณไม่มีสิทธิ์แก้ไของค์ความรู้ของฝ่ายอื่น' }, { status: 403 });
    }

    const body = await req.json();
    const {
      content_type,
      title,
      summary,
      content,
      department_id,
      sub_department_id,
      tags = [],
      status,
      effective_date,
      expiry_date,
      ai_retrieval_enabled = true,
      attachments = []
    } = body;

    const now = new Date().toISOString();
    const tagArray = Array.isArray(tags) ? tags : [tags].filter(Boolean);

    // Determine latest version number
    const maxVersionRow = db.prepare(`
      SELECT MAX(version_no) as max_v FROM knowledge_version_history WHERE knowledge_id = ?
    `).get(knowledgeId) as { max_v: number | null };
    const nextVersionNo = (maxVersionRow?.max_v || 1) + 1;

    const transaction = db.transaction(() => {
      // 1. Snapshot previous content to Version History before overwriting
      db.prepare(`
        INSERT INTO knowledge_version_history (
          version_id, knowledge_id, version_no, title_snapshot, summary_snapshot,
          content_snapshot, tags_snapshot, edited_by, edited_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'ver-' + crypto.randomUUID(),
        knowledgeId,
        nextVersionNo,
        title.trim(),
        summary.trim(),
        content.trim(),
        JSON.stringify(tagArray),
        session.user_id,
        now
      );

      // 2. Update knowledge item
      db.prepare(`
        UPDATE knowledge_items SET
          content_type = ?,
          title = ?,
          summary = ?,
          content = ?,
          department_id = ?,
          sub_department_id = ?,
          tags = ?,
          status = ?,
          effective_date = ?,
          expiry_date = ?,
          ai_retrieval_enabled = ?,
          sync_status = 'pending',
          updated_by = ?,
          updated_at = ?,
          published_at = CASE WHEN ? = 'published' AND published_at IS NULL THEN ? ELSE published_at END
        WHERE knowledge_id = ?
      `).run(
        content_type || existing.content_type,
        title ? title.trim() : existing.title,
        summary ? summary.trim() : existing.summary,
        content ? content.trim() : existing.content,
        isAdmin ? (department_id || existing.department_id) : existing.department_id,
        sub_department_id || existing.sub_department_id,
        JSON.stringify(tagArray),
        status || existing.status,
        effective_date !== undefined ? effective_date : existing.effective_date,
        expiry_date !== undefined ? expiry_date : existing.expiry_date,
        ai_retrieval_enabled ? 1 : 0,
        session.user_id,
        now,
        status || existing.status,
        now,
        knowledgeId
      );

      // 3. Attachments: add any new ones
      if (Array.isArray(attachments) && attachments.length > 0) {
        db.prepare('DELETE FROM knowledge_attachments WHERE knowledge_id = ?').run(knowledgeId);
        const insertAtt = db.prepare(`
          INSERT INTO knowledge_attachments (
            attachment_id, knowledge_id, file_name, file_url, file_type, file_size_kb, uploaded_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        for (const att of attachments) {
          insertAtt.run(
            att.attachment_id || ('att-' + crypto.randomUUID()),
            knowledgeId,
            att.file_name || 'file.pdf',
            att.file_url || '',
            att.file_type || 'pdf',
            att.file_size_kb || 150,
            now
          );
        }
      }

      // 4. Log in Activity Feed
      db.prepare(`
        INSERT INTO activity_feed (
          activity_id, actor_user_id, action_type, target_type, target_id, department_id, title_snapshot, created_at
        ) VALUES (?, ?, 'update', 'knowledge', ?, ?, ?, ?)
      `).run(
        'act-' + crypto.randomUUID(),
        session.user_id,
        knowledgeId,
        existing.department_id,
        title ? title.trim() : existing.title,
        now
      );

      // 5. Invalidate Dashboard Cache
      db.prepare('DELETE FROM dashboard_summary_cache').run();
    });

    transaction();

    return NextResponse.json({
      success: true,
      message: `บันทึกการแก้ไขและจัดเก็บประวัติเวอร์ชัน v${nextVersionNo} เรียบร้อยแล้ว`
    });
  } catch (error: any) {
    console.error('Update knowledge error:', error);
    return NextResponse.json({ error: 'แก้ไขไม่สำเร็จ: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const db = getDb();
    const knowledgeId = params.id;
    const existing = db.prepare('SELECT * FROM knowledge_items WHERE knowledge_id = ?').get(knowledgeId) as any;

    if (!existing) {
      return NextResponse.json({ error: 'ไม่พบรายการนี้' }, { status: 404 });
    }

    const isAdmin = session.role === 'administrator';

    if (isAdmin) {
      // Administrator: Permanent delete
      const transaction = db.transaction(() => {
        db.prepare('DELETE FROM knowledge_attachments WHERE knowledge_id = ?').run(knowledgeId);
        db.prepare('DELETE FROM knowledge_version_history WHERE knowledge_id = ?').run(knowledgeId);
        db.prepare('DELETE FROM activity_feed WHERE target_id = ?').run(knowledgeId);
        db.prepare('DELETE FROM knowledge_items WHERE knowledge_id = ?').run(knowledgeId);
        db.prepare('DELETE FROM dashboard_summary_cache').run();
      });
      transaction();

      return NextResponse.json({
        success: true,
        message: 'ลบองค์ความรู้และประวัติทั้งหมดออกจากระบบถาวรเรียบร้อยแล้ว'
      });
    } else {
      // Staff: Archive instead of permanent delete (Rule 10)
      if (existing.department_id !== session.department_id) {
        return NextResponse.json({ error: 'ไม่มีสิทธิ์ลบข้อมูลของฝ่ายอื่น' }, { status: 403 });
      }

      db.prepare("UPDATE knowledge_items SET status = 'archived', sync_status = 'pending', updated_at = datetime('now', 'localtime') WHERE knowledge_id = ?").run(knowledgeId);
      db.prepare('DELETE FROM dashboard_summary_cache').run();

      return NextResponse.json({
        success: true,
        message: 'เก็บองค์ความรู้นี้เข้าคลังเก็บถาวร (Archived) เรียบร้อยแล้ว และระบบ AI จะหยุดนำข้อมูลนี้ไปตอบทันที'
      });
    }
  } catch (error: any) {
    return NextResponse.json({ error: 'ลบไม่สำเร็จ: ' + error.message }, { status: 500 });
  }
}
