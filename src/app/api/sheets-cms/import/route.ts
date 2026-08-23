import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';
import crypto from 'crypto';
import { BulkImportPreviewRow } from '@/types/sheets';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    if (session.role !== 'administrator') {
      return NextResponse.json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถนำเข้าข้อมูลจำนวนมากได้' }, { status: 403 });
    }

    const body = await req.json();
    const { sheet_name = 'knowledge', action = 'preview', confirmed_rows = [] } = body;

    const db = getDb();
    const validDepts = (db.prepare('SELECT code FROM departments').all() as any[]).map(d => d.code);

    // 1. Preview Mode: Dynamically pull and validate real rows from Google Sheet mirror / Database
    if (action === 'preview') {
      let previewRows: BulkImportPreviewRow[] = [];

      if (sheet_name === 'knowledge' || sheet_name === 'faq') {
        const items = db.prepare(`
          SELECT 
            k.title,
            k.content_type,
            d.code as department_code,
            k.summary,
            k.tags
          FROM knowledge_items k
          LEFT JOIN departments d ON k.department_id = d.department_id
          ${sheet_name === 'faq' ? "WHERE k.content_type = 'faq'" : ''}
          ORDER BY k.created_at DESC
          LIMIT 25
        `).all() as any[];

        previewRows = items.map((item, idx) => {
          const errors: string[] = [];
          if (!item.title || item.title.trim() === '') {
            errors.push('หัวข้อเรื่อง (Title) ต้องไม่เป็นค่าว่าง');
          }
          if (!validDepts.includes(item.department_code)) {
            errors.push(`ไม่พบรหัสฝ่าย ${item.department_code || 'N/A'} ในระบบ`);
          }

          let tagsStr = '';
          try {
            const parsed = JSON.parse(item.tags || '[]');
            tagsStr = Array.isArray(parsed) ? parsed.join(', ') : item.tags;
          } catch (e) {
            tagsStr = item.tags || '';
          }

          return {
            row_no: idx + 2,
            data: {
              title: item.title,
              content_type: item.content_type,
              department_code: item.department_code || 'RES',
              summary: item.summary,
              tags: tagsStr,
            },
            validation_status: errors.length === 0 ? 'valid' : 'invalid',
            errors,
          };
        });
      } else if (sheet_name === 'master_users') {
        const users = db.prepare(`
          SELECT 
            u.first_name || ' ' || u.last_name as title,
            u.role as content_type,
            d.code as department_code,
            u.email as summary,
            u.phone as tags
          FROM master_users u
          LEFT JOIN departments d ON u.department_id = d.department_id
          ORDER BY u.created_at ASC
        `).all() as any[];

        previewRows = users.map((u, idx) => {
          const errors: string[] = [];
          if (!u.title || u.title.trim() === '') errors.push('ชื่อ-สกุลต้องไม่ว่าง');
          if (!validDepts.includes(u.department_code)) errors.push(`ไม่พบรหัสฝ่าย ${u.department_code}`);

          return {
            row_no: idx + 2,
            data: {
              title: u.title,
              content_type: u.content_type,
              department_code: u.department_code || 'RES',
              summary: u.summary,
              tags: u.tags || '-',
            },
            validation_status: errors.length === 0 ? 'valid' : 'invalid',
            errors,
          };
        });
      }

      const validCount = previewRows.filter(r => r.validation_status === 'valid').length;
      const invalidCount = previewRows.filter(r => r.validation_status === 'invalid').length;

      return NextResponse.json({
        total: previewRows.length,
        valid_count: validCount,
        invalid_count: invalidCount,
        preview_rows: previewRows,
      });
    }

    // 2. Execute Import Mode: Batch insert valid rows
    if (action === 'execute') {
      const now = new Date().toISOString();
      let importedCount = 0;

      const transaction = db.transaction(() => {
        const insertKnowledge = db.prepare(`
          INSERT INTO knowledge_items (
            knowledge_id, content_type, title, summary, content, department_id, sub_department_id,
            tags, status, ai_retrieval_enabled, sync_status, created_by, updated_by, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', 1, 'synced', ?, ?, ?, ?)
        `);

        for (const row of confirmed_rows) {
          if (row.validation_status === 'valid') {
            const kid = 'km-import-' + crypto.randomUUID().substring(0, 8);
            const deptRow = db.prepare('SELECT department_id FROM departments WHERE code = ?').get(row.data.department_code) as any;
            const deptId = deptRow ? deptRow.department_id : 'dept-01-resource';
            const subDeptId = 'sub-01-01';

            insertKnowledge.run(
              kid,
              row.data.content_type || 'document',
              row.data.title,
              row.data.summary || row.data.title,
              row.data.summary || row.data.title,
              deptId,
              subDeptId,
              JSON.stringify((row.data.tags || '').split(',').map((t: string) => t.trim())),
              session.user_id,
              session.user_id,
              now,
              now
            );

            importedCount++;
          }
        }

        // Record in Sync Logs
        db.prepare(`
          INSERT INTO sync_logs (log_id, sheet_name, direction, row_reference, status, error_message, synced_at)
          VALUES (?, 'knowledge', 'sheet_to_db', ?, 'success', NULL, ?)
        `).run(
          'slog-' + crypto.randomUUID(),
          `นำเข้าข้อมูลจำนวนมากแบบ Batch (${importedCount} แถว)`,
          now
        );

        db.prepare('DELETE FROM dashboard_summary_cache').run();
      });

      transaction();

      return NextResponse.json({
        success: true,
        imported_count: importedCount,
        message: `นำเข้าข้อมูลลงสู่ระบบสำเร็จเรียบร้อยแล้ว จำนวน ${importedCount} รายการ`,
      });
    }

    return NextResponse.json({ error: 'Action ไม่ถูกต้อง' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
