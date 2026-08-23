import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';

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
    const knowledgeId = params.id;

    const item = db.prepare('SELECT title, department_id, content_type FROM knowledge_items WHERE knowledge_id = ?').get(knowledgeId) as any;
    if (!item) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลองค์ความรู้นี้' }, { status: 404 });
    }

    const versions = db.prepare(`
      SELECT 
        v.*,
        (u.first_name || ' ' || u.last_name) as editor_name
      FROM knowledge_version_history v
      LEFT JOIN master_users u ON v.edited_by = u.user_id
      WHERE v.knowledge_id = ?
      ORDER BY v.version_no DESC
    `).all(knowledgeId);

    const formattedVersions = versions.map((v: any) => {
      let tags: string[] = [];
      try {
        tags = JSON.parse(v.tags_snapshot || '[]');
      } catch (e) {
        tags = v.tags_snapshot ? [v.tags_snapshot] : [];
      }
      return {
        ...v,
        tags_snapshot: tags
      };
    });

    return NextResponse.json({
      knowledge_id: knowledgeId,
      title: item.title,
      content_type: item.content_type,
      versions: formattedVersions
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
