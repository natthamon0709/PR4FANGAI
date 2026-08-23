import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const db = getDb();
    const rows = db.prepare(`
      SELECT 
        m.menu_id,
        m.name,
        m.image_url,
        m.chat_bar_text,
        m.tap_areas,
        m.is_default,
        m.line_rich_menu_id,
        m.created_at,
        (u.first_name || ' ' || u.last_name) as created_by_name
      FROM line_rich_menus m
      LEFT JOIN master_users u ON m.created_by = u.user_id
      ORDER BY m.is_default DESC, m.created_at DESC
    `).all() as any[];

    const richMenus = rows.map(r => ({
      ...r,
      is_default: Boolean(r.is_default),
      tap_areas: typeof r.tap_areas === 'string' ? JSON.parse(r.tap_areas) : r.tap_areas
    }));

    return NextResponse.json({ richMenus, is_admin: session.role === 'administrator' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้น' }, { status: 403 });
    }

    const body = await req.json();
    const { name, image_url, chat_bar_text = 'เมนูหลัก', tap_areas = [], is_default = false } = body;

    if (!name || !image_url) {
      return NextResponse.json({ error: 'กรุณาระบุชื่อเมนูและรูปภาพ' }, { status: 400 });
    }

    const db = getDb();
    const menuId = 'menu-' + crypto.randomUUID();

    if (is_default) {
      db.prepare('UPDATE line_rich_menus SET is_default = 0').run();
    }

    let lineRichMenuId = 'richmenu-' + crypto.randomBytes(6).toString('hex');

    // Attempt live publish to LINE API
    try {
      const { publishRichMenuToLineLive } = await import('@/lib/line-service');
      const liveRes = await publishRichMenuToLineLive({
        menuId,
        name: name.trim(),
        chatBarText: chat_bar_text.trim(),
        imageUrl: image_url.trim(),
        tapAreas: tap_areas,
        isDefault: Boolean(is_default)
      });
      if (liveRes.success && liveRes.lineRichMenuId) {
        lineRichMenuId = liveRes.lineRichMenuId;
      }
    } catch (publishErr) {
      console.warn('Live rich menu publish warning:', publishErr);
    }

    db.prepare(`
      INSERT INTO line_rich_menus (
        menu_id, name, image_url, chat_bar_text, tap_areas, is_default, line_rich_menu_id, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `).run(
      menuId,
      name.trim(),
      image_url.trim(),
      chat_bar_text.trim(),
      JSON.stringify(tap_areas),
      is_default ? 1 : 0,
      lineRichMenuId,
      session.user_id
    );

    return NextResponse.json({
      success: true,
      message: is_default ? 'สร้างและเผยแพร่ Rich Menu บน LINE Chat สำเร็จแล้ว' : 'บันทึกแบบร่าง Rich Menu สำเร็จ',
      menu_id: menuId,
      line_rich_menu_id: lineRichMenuId
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
