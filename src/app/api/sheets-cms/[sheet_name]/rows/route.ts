import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';
import { SheetRowItem, SyncStatus } from '@/types/sheets';

interface RouteParams {
  params: { sheet_name: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const db = getDb();
    const sheetName = params.sheet_name;
    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status') || 'all';
    const search = searchParams.get('search')?.trim() || '';
    const isAdmin = session.role === 'administrator';

    let rows: SheetRowItem[] = [];
    const normalized = sheetName.toLowerCase();

    if (normalized === 'knowledge_base' || normalized === 'knowledge') {
      let query = `
        SELECT 
          k.knowledge_id as record_id,
          k.title,
          k.summary,
          k.content_type,
          k.department_id,
          d.name as department_name,
          k.sync_status,
          COALESCE(u.first_name || ' ' || u.last_name, 'เจ้าหน้าที่') as last_modified_by,
          k.updated_at as last_modified_at
        FROM knowledge_items k
        LEFT JOIN departments d ON k.department_id = d.department_id
        LEFT JOIN master_users u ON k.updated_by = u.user_id
      `;

      const conditions: string[] = [];
      const sqlParams: any[] = [];

      // Staff Scoping: only view department items
      if (!isAdmin) {
        conditions.push(`k.department_id = ?`);
        sqlParams.push(session.department_id);
      }

      if (search) {
        conditions.push(`(k.title LIKE ? OR k.summary LIKE ?)`);
        sqlParams.push(`%${search}%`, `%${search}%`);
      }

      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }

      query += ` ORDER BY k.updated_at DESC`;

      const rawRows = db.prepare(query).all(...sqlParams) as any[];

      // Check conflicts
      const conflictRecordIds = (db.prepare(`
        SELECT record_id FROM sync_conflicts 
        WHERE (sheet_name = 'Knowledge_Base' OR sheet_name = 'knowledge') AND status = 'unresolved'
      `).all() as any[]).map(c => c.record_id);

      rows = rawRows.map((r, idx) => {
        let status: SyncStatus = 'success';
        if (conflictRecordIds.includes(r.record_id)) {
          status = 'conflict';
        } else if (r.sync_status === 'pending') {
          status = 'pending';
        }

        return {
          row_no: idx + 2, // Sheet row starts after header (row 1 is header)
          record_id: r.record_id,
          title: `[${r.content_type || 'เอกสาร'}] ${r.title}`,
          summary: r.summary,
          department_id: r.department_id,
          department_name: r.department_name,
          status,
          last_modified_by: r.last_modified_by,
          last_modified_at: r.last_modified_at,
          error_details: null,
        };
      });
    } else if (normalized === 'master_users') {
      let userQuery = `
        SELECT 
          u.user_id as record_id,
          (u.first_name || ' ' || u.last_name || ' (' || u.role || ')') as title,
          u.email as summary,
          u.department_id,
          d.name as department_name,
          (u.first_name || ' ' || u.last_name) as last_modified_by,
          u.updated_at as last_modified_at
        FROM master_users u
        LEFT JOIN departments d ON u.department_id = d.department_id
      `;

      const conditions: string[] = [];
      const sqlParams: any[] = [];

      if (!isAdmin) {
        conditions.push(`u.department_id = ?`);
        sqlParams.push(session.department_id);
      }

      if (search) {
        conditions.push(`(u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)`);
        sqlParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (conditions.length > 0) {
        userQuery += ` WHERE ${conditions.join(' AND ')}`;
      }

      userQuery += ` ORDER BY u.created_at ASC`;

      const rawUsers = db.prepare(userQuery).all(...sqlParams) as any[];

      const conflictRecordIds = (db.prepare(`
        SELECT record_id FROM sync_conflicts 
        WHERE (sheet_name = 'Master_Users' OR sheet_name = 'master_users') AND status = 'unresolved'
      `).all() as any[]).map(c => c.record_id);

      rows = rawUsers.map((u, idx) => ({
        row_no: idx + 2,
        record_id: u.record_id,
        title: u.title,
        summary: u.summary,
        department_id: u.department_id,
        department_name: u.department_name,
        status: conflictRecordIds.includes(u.record_id) ? 'conflict' : 'success',
        last_modified_by: u.last_modified_by,
        last_modified_at: u.last_modified_at,
        error_details: null,
      }));
    } else if (normalized === 'master_department' || normalized === 'departments') {
      let deptQuery = `
        SELECT 
          d.department_id as record_id, 
          d.name as title, 
          d.code as summary, 
          d.created_at as last_modified_at,
          (SELECT COUNT(*) FROM knowledge_items WHERE department_id = d.department_id) as km_count
        FROM departments d
      `;

      if (search) {
        deptQuery += ` WHERE d.name LIKE '%${search}%' OR d.code LIKE '%${search}%'`;
      }
      deptQuery += ` ORDER BY d.code ASC`;

      const depts = db.prepare(deptQuery).all() as any[];
      rows = depts.map((d, idx) => ({
        row_no: idx + 2,
        record_id: d.record_id,
        title: `${d.title} (${d.summary})`,
        summary: `รหัสฝ่าย: ${d.summary} | จำนวนองค์ความรู้: ${d.km_count} รายการ`,
        status: 'success',
        last_modified_by: 'ผู้ดูแลระบบ',
        last_modified_at: d.last_modified_at,
        error_details: null,
      }));
    } else if (normalized === 'master_section' || normalized === 'sub_departments') {
      let subQuery = `
        SELECT 
          s.sub_department_id as record_id, 
          s.name as title, 
          s.code as summary, 
          d.name as department_name, 
          s.created_at as last_modified_at,
          (SELECT COUNT(*) FROM knowledge_items WHERE sub_department_id = s.sub_department_id) as km_count
        FROM sub_departments s
        LEFT JOIN departments d ON s.department_id = d.department_id
      `;

      if (search) {
        subQuery += ` WHERE s.name LIKE '%${search}%' OR s.code LIKE '%${search}%' OR d.name LIKE '%${search}%'`;
      }
      subQuery += ` ORDER BY s.code ASC`;

      const subs = db.prepare(subQuery).all() as any[];
      rows = subs.map((s, idx) => ({
        row_no: idx + 2,
        record_id: s.record_id,
        title: s.title,
        summary: `รหัส: ${s.summary} | สังกัด: ${s.department_name || '-'} (${s.km_count} รายการ)`,
        department_name: s.department_name,
        status: 'success',
        last_modified_by: 'ผู้ดูแลระบบ',
        last_modified_at: s.last_modified_at,
        error_details: null,
      }));
    } else if (normalized === 'drive_media') {
      let mediaQuery = `
        SELECT 
          media_id as record_id,
          title_or_person_name as title,
          ('รหัสไฟล์: ' || file_id || ' | ลิงก์: ' || image_url) as summary,
          image_url,
          updated_at as last_modified_at
        FROM drive_media_cache
      `;
      if (search) {
        mediaQuery += ` WHERE title_or_person_name LIKE '%${search}%' OR file_id LIKE '%${search}%'`;
      }
      mediaQuery += ` ORDER BY updated_at DESC`;

      const medias = db.prepare(mediaQuery).all() as any[];
      rows = medias.map((m, idx) => ({
        row_no: idx + 2,
        record_id: m.record_id,
        title: m.title,
        summary: m.summary,
        status: 'success',
        last_modified_by: 'Google Drive Sync',
        last_modified_at: m.last_modified_at,
        error_details: null,
      }));
    } else if (normalized === 'knowledge_gaps') {
      let gapQuery = `
        SELECT 
          gap_id as record_id,
          question_text as title,
          ('หมวด: ' || COALESCE(category, 'ทั่วไป') || ' | สถานะ: ' || status) as summary,
          created_at as last_modified_at
        FROM knowledge_gap_logs
      `;
      if (search) {
        gapQuery += ` WHERE question_text LIKE '%${search}%' OR category LIKE '%${search}%'`;
      }
      gapQuery += ` ORDER BY created_at DESC`;

      const gaps = db.prepare(gapQuery).all() as any[];
      rows = gaps.map((g, idx) => ({
        row_no: idx + 2,
        record_id: g.record_id,
        title: g.title,
        summary: g.summary,
        status: 'success',
        last_modified_by: 'AI RAG Engine',
        last_modified_at: g.last_modified_at,
        error_details: null,
      }));
    } else if (normalized === 'ai_query_logs') {
      let logQuery = `
        SELECT 
          log_id as record_id,
          question_text as title,
          ('คำตอบ: ' || SUBSTR(answer_text, 1, 60) || '... | ความมั่นใจ: ' || ROUND(confidence_score * 100, 1) || '%') as summary,
          created_at as last_modified_at
        FROM ai_query_logs
      `;
      if (search) {
        logQuery += ` WHERE question_text LIKE '%${search}%' OR answer_text LIKE '%${search}%'`;
      }
      logQuery += ` ORDER BY created_at DESC`;

      const qlogs = db.prepare(logQuery).all() as any[];
      rows = qlogs.map((q, idx) => ({
        row_no: idx + 2,
        record_id: q.record_id,
        title: q.title,
        summary: q.summary,
        status: 'success',
        last_modified_by: 'LINE User',
        last_modified_at: q.last_modified_at,
        error_details: null,
      }));
    } else if (normalized === 'line_configs') {
      let cfgQuery = `
        SELECT 
          config_id as record_id,
          ('LINE OA: ' || COALESCE(bot_display_name, channel_id)) as title,
          ('Webhook: ' || COALESCE(webhook_url, '-') || ' | Basic ID: ' || COALESCE(bot_basic_id, '-')) as summary,
          updated_at as last_modified_at
        FROM line_channel_configs
      `;
      const cfgs = db.prepare(cfgQuery).all() as any[];
      rows = cfgs.map((c, idx) => ({
        row_no: idx + 2,
        record_id: c.record_id,
        title: c.title,
        summary: c.summary,
        status: 'success',
        last_modified_by: 'ผู้ดูแลระบบ',
        last_modified_at: c.last_modified_at,
        error_details: null,
      }));
    }

    // Filter by status if specified
    if (statusFilter !== 'all') {
      rows = rows.filter(r => r.status === statusFilter);
    }

    const config = db.prepare(`
      SELECT * FROM sheet_sync_configs 
      WHERE sheet_name = ? OR LOWER(sheet_name) = ?
    `).get(sheetName, normalized) as any;

    return NextResponse.json({
      sheet_name: sheetName,
      sheet_config: config ? {
        ...config,
        field_mapping: JSON.parse(config.field_mapping || '{}')
      } : null,
      total_rows: rows.length,
      rows,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
