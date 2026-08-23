import { NextRequest, NextResponse } from 'next/server';
import getDb from '@/lib/db';
import { getSystemSetting } from '@/lib/integrations';

export async function POST(req: NextRequest) {
  try {
    // Check API Key
    const apiKey = req.headers.get('x-api-key') || req.headers.get('x-pr4fang-key');
    const configuredKey = getSystemSetting('n8n_api_key', 'fang_ai_n8n_live_sec_key_2026');

    if (!apiKey || apiKey !== configuredKey) {
      return NextResponse.json({ 
        verified: false, 
        error: 'Invalid API Key for n8n AI agent' 
      }, { status: 401 });
    }

    const { line_user_id } = await req.json();

    if (!line_user_id) {
      return NextResponse.json({ 
        verified: false, 
        error: 'Missing line_user_id parameter' 
      }, { status: 400 });
    }

    const db = getDb();
    const user = db.prepare(`
      SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.status,
        u.department_id,
        u.sub_department_id,
        d.name as department_name,
        s.name as sub_department_name
      FROM master_users u
      LEFT JOIN departments d ON u.department_id = d.department_id
      LEFT JOIN sub_departments s ON u.sub_department_id = s.sub_department_id
      WHERE u.line_user_id = ?
    `).get(line_user_id) as any;

    if (!user) {
      return NextResponse.json({
        verified: false,
        message: 'ไม่พบบัญชีบุคลากรที่เชื่อมกับ LINE บัญชีนี้ (Guest / Public Mode)'
      });
    }

    if (user.status === 'suspended') {
      return NextResponse.json({
        verified: false,
        suspended: true,
        message: 'บัญชีบุคลากรนี้ถูกระงับการใช้งานในระบบ'
      });
    }

    return NextResponse.json({
      verified: true,
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        department_id: user.department_id,
        sub_department_id: user.sub_department_id,
        department_name: user.department_name,
        sub_department_name: user.sub_department_name,
        // AI Permissions Scopes for Phase 5
        ai_permissions: {
          can_access_internal_docs: true,
          can_access_admin_knowledge: user.role === 'administrator',
          department_scope: user.department_name,
          sub_department_scope: user.sub_department_name
        }
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
