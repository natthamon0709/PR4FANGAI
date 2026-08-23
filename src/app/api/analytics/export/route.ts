import { NextRequest, NextResponse } from 'next/server';
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
      db.prepare(`
        INSERT INTO report_export_logs (log_id, user_id, report_type, format, filter_summary, created_at)
        VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))
      `).run('exp-' + crypto.randomUUID(), session.user_id, categories.join(','), format, filter.label + ' (' + deptName + ')');
    } catch {}

    if (format === 'xlsx' || format === 'csv') {
      const lines = [
        `"${title}"`,
        '"วิทยาลัยการอาชีพฝาง อาชีวศึกษาจังหวัดเชียงใหม่"',
        `"ช่วงเวลาข้อมูล:", "${filter.label} (${filter.startDate} ถึง ${filter.endDate})"`,
        `"ขอบเขตฝ่ายงาน:", "${deptName}"`,
        `"ผู้ออกรายงาน:", "${session.first_name || 'ผู้ดูแลระบบ'} ${session.last_name || ''} (${session.role})"`,
        `"วันที่พิมพ์รายงาน:", "${formatThaiDate(new Date().toISOString(), 'full')}"`,
        ''
      ];

      if (categories.includes('usage')) {
        const usage = getUsageAnalytics(filter, deptId, isAdmin);
        lines.push('"=== หมวดที่ 1: รายงานการใช้งานระบบ (System Usage) ==="');
        lines.push('"ตัวชี้วัด (KPI)", "ค่าสถิติ", "หน่วย"');
        usage.kpis.forEach(k => {
          lines.push(`"${k.label}", "${k.value}", "${k.unit || ''}"`);
        });
        lines.push('');
        lines.push('"การเข้าสู่ระบบแยกตามฝ่าย"');
        lines.push('"อันดับ", "ฝ่ายงาน", "จำนวนครั้ง"');
        usage.departmentLogins.forEach(d => {
          lines.push(`"${d.rank}", "${d.title}", "${d.count}"`);
        });
        lines.push('');
      }

      if (categories.includes('knowledge')) {
        const km = getKnowledgeAnalytics(filter, deptId, isAdmin);
        lines.push('"=== หมวดที่ 2: รายงานประสิทธิภาพองค์ความรู้ (Knowledge Management) ==="');
        lines.push('"ตัวชี้วัด (KPI)", "ค่าสถิติ", "หน่วย"');
        km.kpis.forEach(k => {
          lines.push(`"${k.label}", "${k.value}", "${k.unit || ''}"`);
        });
        lines.push('');
        lines.push('"บทความองค์ความรู้ที่ถูกเรียกใช้บ่อยที่สุด"');
        lines.push('"อันดับ", "ชื่อบทความ", "ฝ่ายที่ดูแล", "จำนวนครั้งที่ AI ใช้อ้างอิง"');
        km.topUsedArticles.forEach(a => {
          lines.push(`"${a.rank}", "${a.title}", "${a.subtitle}", "${a.count}"`);
        });
        lines.push('');
      }

      if (categories.includes('ai')) {
        const ai = getAiPerformanceAnalytics(filter, deptId, isAdmin);
        lines.push('"=== หมวดที่ 3: รายงานประสิทธิภาพ AI Engine & RAG ==="');
        lines.push('"ตัวชี้วัด (KPI)", "ค่าสถิติ", "หน่วย"');
        ai.kpis.forEach(k => {
          lines.push(`"${k.label}", "${k.value}", "${k.unit || ''}"`);
        });
        lines.push('');
        lines.push('"ประเด็นที่ AI ยังไม่มีข้อมูลตอบ (Knowledge Gaps)"');
        lines.push('"อันดับ", "คำถาม", "ฝ่ายงานที่คาดว่าเกี่ยวข้อง", "จำนวนครั้งที่ถาม"');
        ai.topKnowledgeGaps.forEach(g => {
          lines.push(`"${g.rank}", "${g.title}", "${g.subtitle}", "${g.count}"`);
        });
        lines.push('');
      }

      if (categories.includes('line')) {
        const line = getLineAnalytics(filter, deptId, isAdmin);
        lines.push('"=== หมวดที่ 4: รายงาน LINE Official Account ==="');
        lines.push('"ตัวชี้วัด (KPI)", "ค่าสถิติ", "หน่วย"');
        line.kpis.forEach(k => {
          lines.push(`"${k.label}", "${k.value}", "${k.unit || ''}"`);
        });
        lines.push('');
      }

      const csvContent = '\uFEFF' + lines.join('\r\n');

      return new Response(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="PR4Fang-Report-${filter.startDate}-to-${filter.endDate}.csv"`
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
