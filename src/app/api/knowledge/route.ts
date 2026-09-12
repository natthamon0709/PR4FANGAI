import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';
import getDb from '@/lib/db';
import crypto from 'crypto';
import { ContentType, KnowledgeStatus } from '@/types/knowledge';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const contentType = searchParams.get('type') || searchParams.get('content_type') || 'all';
    const departmentId = searchParams.get('department_id') || '';
    const subDepartmentId = searchParams.get('sub_department_id') || '';
    const status = searchParams.get('status') || 'all';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10')));
    const offset = (page - 1) * limit;

    const isAdmin = session.role === 'administrator';

    // 1. Try Supabase first
    try {
      let sbQuery = supabaseAdmin
        .from('knowledge_items')
        .select(`
          *,
          departments (name),
          sub_departments (name)
        `, { count: 'exact' });

      if (!isAdmin) {
        sbQuery = sbQuery.or(`department_id.eq.${session.department_id},status.eq.published`);
      }
      if (contentType !== 'all') {
        sbQuery = sbQuery.eq('content_type', contentType);
      }
      if (departmentId && departmentId !== 'all') {
        sbQuery = sbQuery.eq('department_id', departmentId);
      }
      if (subDepartmentId && subDepartmentId !== 'all') {
        sbQuery = sbQuery.eq('sub_department_id', subDepartmentId);
      }
      if (status !== 'all') {
        sbQuery = sbQuery.eq('status', status);
      } else if (!searchParams.get('include_archived')) {
        sbQuery = sbQuery.neq('status', 'archived');
      }
      if (search) {
        sbQuery = sbQuery.or(`title.ilike.%${search}%,summary.ilike.%${search}%,content.ilike.%${search}%`);
      }

      const { data: sbItems, count: sbTotal, error: sbErr } = await sbQuery
        .order('updated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (!sbErr && sbItems) {
        // Calculate type counts
        const { data: allItemsForCounts } = await supabaseAdmin
          .from('knowledge_items')
          .select('content_type');

        const typeCounts: Record<string, number> = {
          all: 0, news: 0, announcement: 0, faq: 0, document: 0,
          manual: 0, regulation: 0, form: 0, service_process: 0
        };

        if (allItemsForCounts) {
          allItemsForCounts.forEach((r: any) => {
            if (typeCounts[r.content_type] !== undefined) {
              typeCounts[r.content_type]++;
              typeCounts.all++;
            }
          });
        }

        const formatted = sbItems.map((item: any) => {
          let parsedTags: string[] = [];
          try {
            parsedTags = JSON.parse(item.tags || '[]');
          } catch {
            parsedTags = item.tags ? [item.tags] : [];
          }
          return {
            ...item,
            department_name: item.departments?.name || '',
            sub_department_name: item.sub_departments?.name || '',
            tags: parsedTags,
            ai_retrieval_enabled: Boolean(item.ai_retrieval_enabled)
          };
        });

        return NextResponse.json({
          items: formatted,
          total: sbTotal || 0,
          page,
          limit,
          totalPages: Math.ceil((sbTotal || 0) / limit) || 1,
          typeCounts
        });
      }
    } catch {}

    // 2. Fallback to SQLite
    const db = getDb();
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (!isAdmin) {
      whereClauses.push(`(k.department_id = ? OR k.status = 'published')`);
      params.push(session.department_id);
    }

    if (contentType !== 'all') {
      whereClauses.push(`k.content_type = ?`);
      params.push(contentType);
    }

    if (departmentId && departmentId !== 'all') {
      whereClauses.push(`k.department_id = ?`);
      params.push(departmentId);
    }

    if (subDepartmentId && subDepartmentId !== 'all') {
      whereClauses.push(`k.sub_department_id = ?`);
      params.push(subDepartmentId);
    }

    if (status !== 'all') {
      whereClauses.push(`k.status = ?`);
      params.push(status);
    } else {
      if (!searchParams.get('include_archived')) {
        whereClauses.push(`k.status != 'archived'`);
      }
    }

    if (search) {
      whereClauses.push(`(k.title LIKE ? OR k.summary LIKE ? OR k.content LIKE ? OR k.tags LIKE ?)`);
      const searchWildcard = `%${search}%`;
      params.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const totalRow = db.prepare(`
      SELECT COUNT(*) as total 
      FROM knowledge_items k 
      ${whereSQL}
    `).get(...params) as { total: number };

    const total = totalRow ? totalRow.total : 0;
    const totalPages = Math.ceil(total / limit) || 1;

    const items = db.prepare(`
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
      ${whereSQL}
      ORDER BY k.updated_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    const typeCountRows = db.prepare(`
      SELECT 
        k.content_type, 
        COUNT(*) as cnt 
      FROM knowledge_items k
      ${!isAdmin ? `WHERE (k.department_id = '${session.department_id}' OR k.status = 'published')` : ''}
      GROUP BY k.content_type
    `).all() as { content_type: string; cnt: number }[];

    const typeCounts: Record<string, number> = {
      all: 0, news: 0, announcement: 0, faq: 0, document: 0,
      manual: 0, regulation: 0, form: 0, service_process: 0,
    };

    let allSum = 0;
    typeCountRows.forEach(r => {
      if (typeCounts[r.content_type] !== undefined) {
        typeCounts[r.content_type] = r.cnt;
        allSum += r.cnt;
      }
    });
    typeCounts.all = allSum;

    const formattedItems = items.map((item: any) => {
      let parsedTags: string[] = [];
      try {
        parsedTags = JSON.parse(item.tags || '[]');
      } catch (e) {
        parsedTags = item.tags ? [item.tags] : [];
      }
      return {
        ...item,
        tags: parsedTags,
        ai_retrieval_enabled: Boolean(item.ai_retrieval_enabled)
      };
    });

    return NextResponse.json({
      items: formattedItems,
      total,
      page,
      limit,
      totalPages,
      typeCounts
    });
  } catch (error: any) {
    console.error('Fetch knowledge error:', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลองค์ความรู้ได้: ' + error.message }, { status: 500 });
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
      content_type,
      title,
      summary,
      content,
      department_id,
      sub_department_id,
      tags = [],
      status = 'published',
      effective_date = null,
      expiry_date = null,
      ai_retrieval_enabled = true,
      attachments = []
    } = body;

    // Validation
    if (!content_type || !title || !summary || !content) {
      return NextResponse.json({ error: 'กรุณากรอกประเภทข้อมูล, หัวข้อเรื่อง, สรุปย่อ และเนื้อหาให้ครบถ้วน' }, { status: 400 });
    }

    const targetDeptId = session.role === 'administrator' ? (department_id || session.department_id) : session.department_id;
    const targetSubDeptId = sub_department_id || session.sub_department_id;

    const todayNum = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randNum = Math.floor(100 + Math.random() * 900);
    const knowledgeId = `KB-${todayNum}-${randNum}`;
    const now = new Date().toISOString();
    const tagArray = Array.isArray(tags) ? tags : [tags].filter(Boolean);

    // 1. Insert into Supabase
    try {
      await supabaseAdmin.from('knowledge_items').insert({
        knowledge_id: knowledgeId,
        content_type,
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
        department_id: targetDeptId,
        sub_department_id: targetSubDeptId,
        tags: JSON.stringify(tagArray),
        status,
        effective_date: effective_date || null,
        expiry_date: expiry_date || null,
        ai_retrieval_enabled: ai_retrieval_enabled ? 1 : 0,
        view_count: 0,
        ai_reference_count: 0,
        sync_status: 'synced',
        created_by: session.user_id,
        updated_by: session.user_id,
        created_at: now,
        updated_at: now,
        published_at: status === 'published' ? now : null
      });

      await supabaseAdmin.from('knowledge_version_history').insert({
        version_id: 'ver-' + crypto.randomUUID(),
        knowledge_id: knowledgeId,
        version_no: 1,
        title_snapshot: title.trim(),
        summary_snapshot: summary.trim(),
        content_snapshot: content.trim(),
        tags_snapshot: JSON.stringify(tagArray),
        edited_by: session.user_id,
        edited_at: now
      });

      if (Array.isArray(attachments) && attachments.length > 0) {
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

      await supabaseAdmin.from('activity_feed').insert({
        activity_id: 'act-' + crypto.randomUUID(),
        actor_user_id: session.user_id,
        action_type: 'create',
        target_type: 'knowledge',
        target_id: knowledgeId,
        department_id: targetDeptId,
        title_snapshot: title.trim(),
        created_at: now
      });
    } catch (sbErr) {
      console.warn('Supabase knowledge insert warning:', sbErr);
    }

    // 2. Insert into SQLite mirror
    try {
      const db = getDb();
      db.prepare(`
        INSERT INTO knowledge_items (
          knowledge_id, content_type, title, summary, content, department_id, sub_department_id,
          tags, status, effective_date, expiry_date, ai_retrieval_enabled, view_count, ai_reference_count,
          sync_status, created_by, updated_by, created_at, updated_at, published_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'synced', ?, ?, ?, ?, ?)
      `).run(
        knowledgeId,
        content_type,
        title.trim(),
        summary.trim(),
        content.trim(),
        targetDeptId,
        targetSubDeptId,
        JSON.stringify(tagArray),
        status,
        effective_date || null,
        expiry_date || null,
        ai_retrieval_enabled ? 1 : 0,
        session.user_id,
        session.user_id,
        now,
        now,
        status === 'published' ? now : null
      );

      db.prepare(`
        INSERT INTO knowledge_version_history (
          version_id, knowledge_id, version_no, title_snapshot, summary_snapshot,
          content_snapshot, tags_snapshot, edited_by, edited_at
        ) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?)
      `).run(
        'ver-' + crypto.randomUUID(),
        knowledgeId,
        title.trim(),
        summary.trim(),
        content.trim(),
        JSON.stringify(tagArray),
        session.user_id,
        now
      );

      if (Array.isArray(attachments) && attachments.length > 0) {
        for (const att of attachments) {
          db.prepare(`
            INSERT INTO knowledge_attachments (
              attachment_id, knowledge_id, file_name, file_url, file_type, file_size_kb, uploaded_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            'att-' + crypto.randomUUID(),
            knowledgeId,
            att.file_name || 'attachment.pdf',
            att.file_url || '',
            att.file_type || 'pdf',
            att.file_size_kb || 100,
            now
          );
        }
      }

      db.prepare(`
        INSERT INTO activity_feed (
          activity_id, actor_user_id, action_type, target_type, target_id, department_id, title_snapshot, created_at
        ) VALUES (?, ?, 'create', 'knowledge', ?, ?, ?, ?)
      `).run(
        'act-' + crypto.randomUUID(),
        session.user_id,
        knowledgeId,
        targetDeptId,
        title.trim(),
        now
      );

      db.prepare('DELETE FROM dashboard_summary_cache').run();
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'บันทึกองค์ความรู้ลงฐานข้อมูลเรียบร้อยแล้ว',
      knowledge_id: knowledgeId
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create knowledge error:', error);
    return NextResponse.json({ error: 'ไม่สามารถบันทึกองค์ความรู้ได้: ' + error.message }, { status: 500 });
  }
}
