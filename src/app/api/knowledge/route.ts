import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';
import crypto from 'crypto';
import { ContentType, KnowledgeStatus } from '@/types/knowledge';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const db = getDb();
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

    // Base WHERE conditions
    const whereClauses: string[] = [];
    const params: any[] = [];

    // Role-based visibility: Staff see all published items across the college, but only draft/archived within their department
    if (!isAdmin) {
      whereClauses.push(`(k.department_id = ? OR k.status = 'published')`);
      params.push(session.department_id);
    }

    // Filter by content_type
    if (contentType !== 'all') {
      whereClauses.push(`k.content_type = ?`);
      params.push(contentType);
    }

    // Filter by department
    if (departmentId && departmentId !== 'all') {
      whereClauses.push(`k.department_id = ?`);
      params.push(departmentId);
    }

    // Filter by sub_department
    if (subDepartmentId && subDepartmentId !== 'all') {
      whereClauses.push(`k.sub_department_id = ?`);
      params.push(subDepartmentId);
    }

    // Filter by status
    if (status !== 'all') {
      whereClauses.push(`k.status = ?`);
      params.push(status);
    } else {
      // By default, exclude archived unless specifically requested or filtering
      if (!searchParams.get('include_archived')) {
        whereClauses.push(`k.status != 'archived'`);
      }
    }

    // Search term (Debounced on Frontend)
    if (search) {
      whereClauses.push(`(k.title LIKE ? OR k.summary LIKE ? OR k.content LIKE ? OR k.tags LIKE ?)`);
      const searchWildcard = `%${search}%`;
      params.push(searchWildcard, searchWildcard, searchWildcard, searchWildcard);
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Total Count
    const totalRow = db.prepare(`
      SELECT COUNT(*) as total 
      FROM knowledge_items k 
      ${whereSQL}
    `).get(...params) as { total: number };

    const total = totalRow ? totalRow.total : 0;
    const totalPages = Math.ceil(total / limit) || 1;

    // Fetch Items with department names and creator names
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

    // Calculate Type Counts for Tabs (C33)
    const typeCountRows = db.prepare(`
      SELECT 
        k.content_type, 
        COUNT(*) as cnt 
      FROM knowledge_items k
      ${!isAdmin ? `WHERE (k.department_id = '${session.department_id}' OR k.status = 'published')` : ''}
      GROUP BY k.content_type
    `).all() as { content_type: string; cnt: number }[];

    const typeCounts: Record<string, number> = {
      all: 0,
      news: 0,
      announcement: 0,
      faq: 0,
      document: 0,
      manual: 0,
      regulation: 0,
      form: 0,
      service_process: 0,
    };

    let allSum = 0;
    typeCountRows.forEach(r => {
      if (typeCounts[r.content_type] !== undefined) {
        typeCounts[r.content_type] = r.cnt;
        allSum += r.cnt;
      }
    });
    typeCounts.all = allSum;

    // Parse tags JSON array
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

    // Role Scoping: Staff can only create for their own department
    const targetDeptId = session.role === 'administrator' ? (department_id || session.department_id) : session.department_id;
    const targetSubDeptId = sub_department_id || session.sub_department_id;

    const db = getDb();
    const todayNum = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randNum = Math.floor(100 + Math.random() * 900);
    const knowledgeId = `KB-${todayNum}-${randNum}`;
    const now = new Date().toISOString();
    const tagArray = Array.isArray(tags) ? tags : [tags].filter(Boolean);

    const transaction = db.transaction(() => {
      // 1. Insert knowledge_item
      db.prepare(`
        INSERT INTO knowledge_items (
          knowledge_id, content_type, title, summary, content, department_id, sub_department_id,
          tags, status, effective_date, expiry_date, ai_retrieval_enabled, view_count, ai_reference_count,
          sync_status, created_by, updated_by, created_at, updated_at, published_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'pending', ?, ?, ?, ?, ?)
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

      // 2. Insert initial Version History snapshot (v1)
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

      // 3. Insert attachments if provided
      if (Array.isArray(attachments) && attachments.length > 0) {
        const insertAtt = db.prepare(`
          INSERT INTO knowledge_attachments (
            attachment_id, knowledge_id, file_name, file_url, file_type, file_size_kb, uploaded_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        for (const att of attachments) {
          insertAtt.run(
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

      // 4. Log in Activity Feed
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

      // 5. Auto-resolve matching open Knowledge Gaps
      if (status === 'published') {
        const cleanTitle = title.trim();
        db.prepare(`
          UPDATE knowledge_gap_logs 
          SET status = 'resolved' 
          WHERE status = 'open' 
          AND (
            LOWER(question_text) = LOWER(?)
            OR LOWER(?) LIKE '%' || LOWER(question_text) || '%'
            OR LOWER(question_text) LIKE '%' || LOWER(?) || '%'
          )
        `).run(cleanTitle, cleanTitle, cleanTitle);
      }

      // 6. Invalidate Dashboard Cache
      db.prepare('DELETE FROM dashboard_summary_cache').run();
    });

    transaction();

    // 6. Push to Google Sheets (Two-Way Sync Stage/Push with exact 29 columns)
    const { pushToGoogleSheets } = await import('@/lib/google-sheets-sync');
    const deptRow = db.prepare('SELECT name FROM departments WHERE department_id = ?').get(targetDeptId) as any;
    const subDeptRow = db.prepare('SELECT name FROM sub_departments WHERE sub_department_id = ?').get(targetSubDeptId) as any;
    const todayStr = new Date().toISOString().split('T')[0];
    const nowLocal = new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' });

    pushToGoogleSheets('Knowledge_Base', 'create', {
      knowledge_id: knowledgeId,
      created_at: nowLocal,
      updated_at: nowLocal,
      form_response_id: 'WEB-APP',
      email: session.email || 'admin@fang.ac.th',
      full_name: `${session.first_name || 'ผู้ดูแลระบบ'} ${session.last_name || ''}`.trim(),
      class_room: '-',
      record_date: todayStr,
      department: deptRow?.name || 'ฝ่ายบริหารทรัพยากร',
      section: subDeptRow?.name || 'งานบริหารงานทั่วไป',
      content_type: content_type === 'faq' ? 'FAQ' : (content_type === 'news' ? 'ข่าวประชาสัมพันธ์' : (content_type === 'announcement' ? 'ประกาศ' : 'ข้อมูล,เอกสาร')),
      title: title.trim(),
      description: content.trim() || summary.trim(),
      status: status === 'published' ? 'Published' : 'Draft',
      target_group: 'ปวช. , ปวส. , ผู้ปกครอง',
      publish_start: effective_date || todayStr,
      publish_end: expiry_date || '-',
      keywords: tagArray.join(', '),
      faq: content_type === 'faq' ? `Q: ${title.trim()}` : '-',
      faq_answer: content_type === 'faq' ? `A: ${content.trim() || summary.trim()}` : '-',
      drive_url: '-',
      website_url: '-',
      source: 'วิทยาลัยการอาชีพฝาง',
      officer: `${session.first_name || 'เจ้าหน้าที่'} ${session.last_name || ''}`.trim(),
      officer_email: session.email || 'admin@fang.ac.th',
      officer_tel: '053-451234',
      sync_status: 'Synced',
      external_id: '-',
      note: '-'
    }).catch(err => console.error('Push to Google Sheets error:', err));

    return NextResponse.json({
      success: true,
      message: 'บันทึกองค์ความรู้เรียบร้อยแล้ว และจัดคิวซิงค์ไปยัง Google Sheet',
      knowledge_id: knowledgeId
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create knowledge error:', error);
    return NextResponse.json({ error: 'ไม่สามารถบันทึกองค์ความรู้ได้: ' + error.message }, { status: 500 });
  }
}
