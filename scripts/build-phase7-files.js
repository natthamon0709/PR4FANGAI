const fs = require('fs');
const path = require('path');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// 1. Export API
ensureDir('./src/app/api/analytics/export');
fs.writeFileSync('./src/app/api/analytics/export/route.ts', `import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';
import { resolveDateRange, getAnalyticsOverview, getKnowledgeAnalytics, getAiPerformanceAnalytics, getUsageAnalytics, getLineAnalytics, formatThaiDate } from '@/lib/analytics-service';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { categories = ['usage', 'knowledge', 'ai', 'line'], startDate, endDate, format = 'xlsx', title = 'รายงานสรุปการวิเคราะห์ระบบ PR4Fang AI' } = body;

    const isAdmin = session.role === 'administrator';
    const deptId = !isAdmin ? session.department_id : body.department_id;
    const filter = resolveDateRange('custom', startDate, endDate);

    const db = getDb();
    const deptName = deptId ? (db.prepare('SELECT name FROM departments WHERE department_id = ?').get(deptId) as any)?.name : 'ทุกฝ่ายงาน (ทั้งวิทยาลัย)';

    // Log export
    try {
      db.prepare(\`
        INSERT INTO report_export_logs (log_id, user_id, report_type, format, filter_summary, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))
      \`).run('exp-' + crypto.randomUUID(), session.user_id, categories.join(','), format, filter.label + ' (' + deptName + ')');
    } catch {}

    if (format === 'xlsx' || format === 'csv') {
      let csv = '\uFEFF';
      csv += '"' + title + '"\r\n';
      csv += '"วิทยาลัยการอาชีพฝาง อาชีวศึกษาจังหวัดเชียงใหม่"\r\n';
      csv += '"ช่วงเวลาข้อมูล:", "' + filter.label + ' (' + filter.startDate + ' ถึง ' + filter.endDate + ')"\r\n';
      csv += '"ขอบเขตฝ่ายงาน:", "' + deptName + '"\r\n';
      csv += '"ผู้ออกรายงาน:", "' + (session.first_name || 'ผู้ดูแลระบบ') + ' ' + (session.last_name || '') + ' (' + session.role + ')"\r\n';
      csv += '"วันที่พิมพ์รายงาน:", "' + formatThaiDate(new Date().toISOString(), 'full') + '"\r\n\r\n';

      if (categories.includes('usage')) {
        const usage = getUsageAnalytics(filter, deptId, isAdmin);
        csv += '"=== หมวดที่ 1: รายงานการใช้งานระบบ (System Usage) ==="\r\n';
        csv += '"ตัวชี้วัด (KPI)", "ค่าสถิติ", "หน่วย"\r\n';
        usage.kpis.forEach(k => { csv += '"' + k.label + '", "' + k.value + '", "' + (k.unit || '') + '"\r\n'; });
        csv += '\r\n"การเข้าสู่ระบบแยกตามฝ่าย"\r\n"อันดับ", "ฝ่ายงาน", "จำนวนครั้ง"\r\n';
        usage.departmentLogins.forEach(d => { csv += '"' + d.rank + '", "' + d.title + '", "' + d.count + '"\r\n'; });
        csv += '\r\n';
      }

      if (categories.includes('knowledge')) {
        const km = getKnowledgeAnalytics(filter, deptId, isAdmin);
        csv += '"=== หมวดที่ 2: รายงานประสิทธิภาพองค์ความรู้ (Knowledge Management) ==="\r\n';
        csv += '"ตัวชี้วัด (KPI)", "ค่าสถิติ", "หน่วย"\r\n';
        km.kpis.forEach(k => { csv += '"' + k.label + '", "' + k.value + '", "' + (k.unit || '') + '"\r\n'; });
        csv += '\r\n"บทความองค์ความรู้ที่ถูกเรียกใช้บ่อยที่สุด"\r\n"อันดับ", "ชื่อบทความ", "ฝ่ายที่ดูแล", "จำนวนครั้งที่ AI ใช้อ้างอิง"\r\n';
        km.topUsedArticles.forEach(a => { csv += '"' + a.rank + '", "' + a.title + '", "' + a.subtitle + '", "' + a.count + '"\r\n'; });
        csv += '\r\n';
      }

      if (categories.includes('ai')) {
        const ai = getAiPerformanceAnalytics(filter, deptId, isAdmin);
        csv += '"=== หมวดที่ 3: รายงานประสิทธิภาพ AI Engine & RAG ==="\r\n';
        csv += '"ตัวชี้วัด (KPI)", "ค่าสถิติ", "หน่วย"\r\n';
        ai.kpis.forEach(k => { csv += '"' + k.label + '", "' + k.value + '", "' + (k.unit || '') + '"\r\n'; });
        csv += '\r\n"ประเด็นที่ AI ยังไม่มีข้อมูลตอบ (Knowledge Gaps)"\r\n"อันดับ", "คำถาม", "ฝ่ายงานที่คาดว่าเกี่ยวข้อง", "จำนวนครั้งที่ถาม"\r\n';
        ai.topKnowledgeGaps.forEach(g => { csv += '"' + g.rank + '", "' + g.title + '", "' + g.subtitle + '", "' + g.count + '"\r\n'; });
        csv += '\r\n';
      }

      if (categories.includes('line')) {
        const line = getLineAnalytics(filter, deptId, isAdmin);
        csv += '"=== หมวดที่ 4: รายงาน LINE Official Account ==="\r\n';
        csv += '"ตัวชี้วัด (KPI)", "ค่าสถิติ", "หน่วย"\r\n';
        line.kpis.forEach(k => { csv += '"' + k.label + '", "' + k.value + '", "' + (k.unit || '') + '"\r\n'; });
        csv += '\r\n';
      }

      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="PR4Fang-Report-' + filter.startDate + '-to-' + filter.endDate + '.csv"'
        }
      });
    }

    const overview = getAnalyticsOverview(filter, deptId, isAdmin);
    const usage = categories.includes('usage') ? getUsageAnalytics(filter, deptId, isAdmin) : null;
    const knowledge = categories.includes('knowledge') ? getKnowledgeAnalytics(filter, deptId, isAdmin) : null;
    const ai = categories.includes('ai') ? getAiPerformanceAnalytics(filter, deptId, isAdmin) : null;
    const line = categories.includes('line') ? getLineAnalytics(filter, deptId, isAdmin) : null;

    return NextResponse.json({
      success: true,
      meta: {
        title,
        college: 'วิทยาลัยการอาชีพฝาง อาชีวศึกษาจังหวัดเชียงใหม่',
        dateRangeLabel: filter.label,
        startDate: filter.startDate,
        endDate: filter.endDate,
        departmentName: deptName,
        generatedBy: (session.first_name || 'ผู้ดูแลระบบ') + ' ' + (session.last_name || ''),
        generatedAt: formatThaiDate(new Date().toISOString(), 'full')
      },
      overview,
      usage,
      knowledge,
      ai,
      line
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`, 'utf8');

// 2. Scheduled Reports
ensureDir('./src/app/api/analytics/scheduled-reports');
fs.writeFileSync('./src/app/api/analytics/scheduled-reports/route.ts', `import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';
import crypto from 'crypto';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden: Administrator only' }, { status: 403 });
    }

    const db = getDb();
    const rows = db.prepare(\`
      SELECT 
        s.*,
        u.first_name || ' ' || u.last_name as creator_name
      FROM scheduled_report_configs s
      LEFT JOIN master_users u ON s.created_by = u.user_id
      ORDER BY s.created_at DESC
    \`).all() as any[];

    const schedules = rows.map(r => ({
      ...r,
      recipients: JSON.parse(r.recipients || '[]'),
      is_active: Boolean(r.is_active)
    }));

    return NextResponse.json({ schedules });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden: Administrator only' }, { status: 403 });
    }

    const body = await req.json();
    const { report_type = 'ai_performance', frequency = 'monthly', recipients = [], format = 'pdf', is_active = true } = body;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json({ error: 'กรุณาระบุผู้รับรายงานอย่างน้อย 1 รายการ' }, { status: 400 });
    }

    const db = getDb();
    const configId = 'sched-' + crypto.randomUUID();

    db.prepare(\`
      INSERT INTO scheduled_report_configs (
        config_id, report_type, frequency, recipients, format, is_active, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    \`).run(
      configId,
      report_type,
      frequency,
      JSON.stringify(recipients),
      format,
      is_active ? 1 : 0,
      session.user_id
    );

    return NextResponse.json({ success: true, config_id: configId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`, 'utf8');

// 3. Single Scheduled Report API
ensureDir('./src/app/api/analytics/scheduled-reports/[id]');
fs.writeFileSync('./src/app/api/analytics/scheduled-reports/[id]/route.ts', `import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden: Administrator only' }, { status: 403 });
    }

    const body = await req.json();
    const db = getDb();

    if (body.is_active !== undefined) {
      db.prepare('UPDATE scheduled_report_configs SET is_active = ? WHERE config_id = ?').run(body.is_active ? 1 : 0, params.id);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Forbidden: Administrator only' }, { status: 403 });
    }

    const db = getDb();
    db.prepare('DELETE FROM scheduled_report_configs WHERE config_id = ?').run(params.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
`, 'utf8');

console.log('All export and scheduled report routes written successfully!');
