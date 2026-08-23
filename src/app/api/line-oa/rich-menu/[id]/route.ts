import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const db = getDb();
    const row = db.prepare('SELECT * FROM line_rich_menus WHERE menu_id = ?').get(params.id) as any;

    if (!row) {
      return NextResponse.json({ error: 'ไม่พบ Rich Menu' }, { status: 404 });
    }

    return NextResponse.json({
      richMenu: {
        ...row,
        is_default: Boolean(row.is_default),
        tap_areas: typeof row.tap_areas === 'string' ? JSON.parse(row.tap_areas) : row.tap_areas
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้น' }, { status: 403 });
    }

    const body = await req.json();
    const { name, image_url, chat_bar_text, tap_areas, is_default, publish_now } = body;
    const db = getDb();

    if (is_default) {
      db.prepare('UPDATE line_rich_menus SET is_default = 0').run();
    }

    db.prepare(`
      UPDATE line_rich_menus
      SET name = coalesce(?, name),
          image_url = coalesce(?, image_url),
          chat_bar_text = coalesce(?, chat_bar_text),
          tap_areas = coalesce(?, tap_areas),
          is_default = coalesce(?, is_default)
      WHERE menu_id = ?
    `).run(
      name,
      image_url,
      chat_bar_text,
      tap_areas ? JSON.stringify(tap_areas) : null,
      is_default !== undefined ? (is_default ? 1 : 0) : null,
      params.id
    );

    const updatedRow = db.prepare('SELECT * FROM line_rich_menus WHERE menu_id = ?').get(params.id) as any;

    let linePublishSuccess = false;
    let linePublishError = '';

    if (is_default || publish_now || updatedRow?.is_default) {
      try {
        const { publishRichMenuToLineLive } = await import('@/lib/line-service');
        const liveRes = await publishRichMenuToLineLive({
          menuId: params.id,
          name: updatedRow.name,
          chatBarText: updatedRow.chat_bar_text,
          imageUrl: updatedRow.image_url,
          tapAreas: typeof updatedRow.tap_areas === 'string' ? JSON.parse(updatedRow.tap_areas) : updatedRow.tap_areas,
          isDefault: true
        });

        if (liveRes.success) {
          linePublishSuccess = true;
        } else {
          linePublishError = liveRes.error || '';
        }
      } catch (pubErr: any) {
        linePublishError = pubErr.message;
      }
    }

    return NextResponse.json({
      success: true,
      message: linePublishSuccess
        ? 'บันทึกและเผยแพร่ Rich Menu บน LINE Chat สำเร็จแล้ว'
        : (linePublishError ? `บันทึกแบบร่างสำเร็จ (คำเตือน LINE API: ${linePublishError})` : 'อัปเดต Rich Menu สำเร็จ'),
      line_published: linePublishSuccess
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้น' }, { status: 403 });
    }

    const db = getDb();
    db.prepare('DELETE FROM line_rich_menus WHERE menu_id = ?').run(params.id);

    return NextResponse.json({ success: true, message: 'ลบ Rich Menu เรียบร้อยแล้ว' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
