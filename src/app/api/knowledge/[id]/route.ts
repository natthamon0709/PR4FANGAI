import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
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

    const knowledgeId = params.id;

    // 1. Try Supabase
    try {
      const { data: sbItem, error: sbErr } = await supabaseAdmin
        .from('knowledge_items')
        .select(`
          *,
          departments (name),
          sub_departments (name)
        `)
        .eq('knowledge_id', knowledgeId)
        .maybeSingle();

      if (!sbErr && sbItem) {
        const isAdmin = session.role === 'administrator';
        if (!isAdmin && sbItem.department_id !== session.department_id && sbItem.status !== 'published') {
          return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึงข้อมูลร่างของฝ่ายอื่น' }, { status: 403 });
        }

        // Increment view_count asynchronously
        supabaseAdmin
          .from('knowledge_items')
          .update({ view_count: (sbItem.view_count || 0) + 1 })
          .eq('knowledge_id', knowledgeId)
          .then();

        // Fetch attachments
        const { data: sbAttachments } = await supabaseAdmin
          .from('knowledge_attachments')
          .select('*')
          .eq('knowledge_id', knowledgeId)
          .order('uploaded_at', { ascending: false });

        let parsedTags: string[] = [];
        try {
          parsedTags = JSON.parse(sbItem.tags || '[]');
        } catch (e) {
          parsedTags = sbItem.tags ? [sbItem.tags] : [];
        }

        return NextResponse.json({
          item: {
            ...sbItem,
            department_name: (sbItem.departments as any)?.name || '',
            sub_department_name: (sbItem.sub_departments as any)?.name || '',
            tags: parsedTags,
            ai_retrieval_enabled: Boolean(sbItem.ai_retrieval_enabled),
            attachments: sbAttachments || []
          }
        });
      }
    } catch {}

    // 2. Fallback to SQLite
    const db = getDb();
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

    const isAdmin = session.role === 'administrator';
    if (!isAdmin && item.department_id !== session.department_id && item.status !== 'published') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึงข้อมูลร่างของฝ่ายอื่น' }, { status: 403 });
    }

    db.prepare('UPDATE knowledge_items SET view_count = view_count + 1 WHERE knowledge_id = ?').run(knowledgeId);

    const attachments = db.prepare(`
      SELECT * FROM knowledge_attachments WHERE knowledge_id = ? ORDER BY uploaded_at DESC
    `).all(knowledgeId);

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

    const knowledgeId = params.id;
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

    // 1. Update in Supabase
    try {
      await supabaseAdmin.from('knowledge_items').update({
        content_type,
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
        department_id,
        sub_department_id,
        tags: JSON.stringify(tagArray),
        status,
        effective_date: effective_date || null,
        expiry_date: expiry_date || null,
        ai_retrieval_enabled: ai_retrieval_enabled ? 1 : 0,
        updated_by: session.user_id,
        updated_at: now
      }).eq('knowledge_id', knowledgeId);

      await supabaseAdmin.from('knowledge_version_history').insert({
        version_id: 'ver-' + crypto.randomUUID(),
        knowledge_id: knowledgeId,
        version_no: Date.now(),
        title_snapshot: title.trim(),
        summary_snapshot: summary.trim(),
        content_snapshot: content.trim(),
        tags_snapshot: JSON.stringify(tagArray),
        edited_by: session.user_id,
        edited_at: now
      });

      if (Array.isArray(attachments) && attachments.length > 0) {
        await supabaseAdmin.from('knowledge_attachments').delete().eq('knowledge_id', knowledgeId);
        for (const att of attachments) {
          await supabaseAdmin.from('knowledge_attachments').insert({
            attachment_id: 'att-' + crypto.randomUUID(),
            knowledge_id: knowledgeId,
            file_name: att.file_name || 'attachment.pdf',
            file_url: att.file_url || '',
            file_type: att.file_type || 'pdf',
            file_size_kb: att.file_size_kb || 100,
            uploaded_at: now
          });
        }
      }
    } catch (sbErr) {
      console.warn('Supabase knowledge update error:', sbErr);
    }

    // 2. Fallback / mirror in SQLite
    try {
      const db = getDb();
      const existing = db.prepare('SELECT * FROM knowledge_items WHERE knowledge_id = ?').get(knowledgeId) as any;
      if (existing) {
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
            updated_by = ?,
            updated_at = ?
          WHERE knowledge_id = ?
        `).run(
          content_type || existing.content_type,
          title ? title.trim() : existing.title,
          summary ? summary.trim() : existing.summary,
          content ? content.trim() : existing.content,
          department_id || existing.department_id,
          sub_department_id || existing.sub_department_id,
          JSON.stringify(tagArray),
          status || existing.status,
          effective_date || null,
          expiry_date || null,
          ai_retrieval_enabled ? 1 : 0,
          session.user_id,
          now,
          knowledgeId
        );
      }
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'บันทึกการแก้ไขเรียบร้อยแล้ว'
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

    const knowledgeId = params.id;
    const isAdmin = session.role === 'administrator';

    // 1. Delete or Archive in Supabase
    try {
      if (isAdmin) {
        await supabaseAdmin.from('knowledge_attachments').delete().eq('knowledge_id', knowledgeId);
        await supabaseAdmin.from('knowledge_version_history').delete().eq('knowledge_id', knowledgeId);
        await supabaseAdmin.from('knowledge_items').delete().eq('knowledge_id', knowledgeId);
      } else {
        await supabaseAdmin.from('knowledge_items').update({
          status: 'archived',
          updated_at: new Date().toISOString()
        }).eq('knowledge_id', knowledgeId);
      }
    } catch (sbErr) {
      console.warn('Supabase delete error:', sbErr);
    }

    // 2. Delete or Archive in SQLite
    try {
      const db = getDb();
      if (isAdmin) {
        db.prepare('DELETE FROM knowledge_attachments WHERE knowledge_id = ?').run(knowledgeId);
        db.prepare('DELETE FROM knowledge_version_history WHERE knowledge_id = ?').run(knowledgeId);
        db.prepare('DELETE FROM knowledge_items WHERE knowledge_id = ?').run(knowledgeId);
      } else {
        db.prepare("UPDATE knowledge_items SET status = 'archived', updated_at = datetime('now', 'localtime') WHERE knowledge_id = ?").run(knowledgeId);
      }
    } catch {}

    return NextResponse.json({
      success: true,
      message: isAdmin ? 'ลบองค์ความรู้เรียบร้อยแล้ว' : 'เก็บองค์ความรู้นี้เข้าคลังเก็บถาวร (Archived) เรียบร้อยแล้ว'
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'ลบไม่สำเร็จ: ' + error.message }, { status: 500 });
  }
}
