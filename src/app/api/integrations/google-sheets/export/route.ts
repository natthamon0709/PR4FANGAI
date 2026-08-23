import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { exportUsersForGoogleSheets, GOOGLE_SHEET_CONFIG, getSystemSetting } from '@/lib/integrations';
import { pushToGoogleSheets } from '@/lib/google-sheets-sync';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    const apiKey = req.headers.get('x-api-key') || req.headers.get('x-pr4fang-key');
    const configuredKey = getSystemSetting('n8n_api_key', 'fang_ai_n8n_live_sec_key_2026');
    const isApiKeyValid = Boolean(apiKey && apiKey === configuredKey);

    if ((!session || session.role !== 'administrator') && !isApiKeyValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const exportData = exportUsersForGoogleSheets();

    return NextResponse.json({
      googleSheet: GOOGLE_SHEET_CONFIG,
      ...exportData
    });
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const users = db.prepare(`
      SELECT 
        u.*,
        d.name as department_name,
        s.name as sub_department_name
      FROM master_users u
      LEFT JOIN departments d ON u.department_id = d.department_id
      LEFT JOIN sub_departments s ON u.sub_department_id = s.sub_department_id
      ORDER BY u.created_at ASC
    `).all() as any[];

    let pushedCount = 0;
    for (const u of users) {
      await pushToGoogleSheets('Master_Users', 'update', {
        user_id: u.user_id,
        first_name: u.first_name,
        last_name: u.last_name,
        email: u.email,
        phone: u.phone,
        department_name: u.department_name,
        sub_department_name: u.sub_department_name,
        role: u.role,
        status: u.status,
        line_user_id: u.line_user_id
      });
      pushedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `ส่งข้อมูลผู้ใช้งานจำนวน ${pushedCount} รายการไปยัง Google Sheet สำเร็จแล้ว`,
      count: pushedCount
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
