import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { KnowledgeModel } from '@/models/knowledge.model';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
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

    const knowledgeId = params.id;
    const item = await KnowledgeModel.findKnowledgeById(knowledgeId, session);
    if (!item) {
      return NextResponse.json({ error: 'ไม่พบข้อมูลองค์ความรู้นี้' }, { status: 404 });
    }

    // 1. Try Supabase
    if (isSupabaseConfigured()) {
      try {
        const { data: sbVersions, error: sbErr } = await supabaseAdmin
          .from('knowledge_version_history')
          .select(`
            *,
            master_users (first_name, last_name)
          `)
          .eq('knowledge_id', knowledgeId)
          .order('version_no', { ascending: false });

        if (!sbErr && sbVersions && sbVersions.length > 0) {
          const formattedVersions = sbVersions.map((v: any) => {
            let tags: string[] = [];
            try {
              tags = JSON.parse(v.tags_snapshot || '[]');
            } catch {
              tags = v.tags_snapshot ? [v.tags_snapshot] : [];
            }
            const editorName = v.master_users 
              ? `${v.master_users.first_name} ${v.master_users.last_name}`.trim()
              : 'เจ้าหน้าที่';
            return {
              ...v,
              editor_name: editorName,
              tags_snapshot: tags
            };
          });

          return NextResponse.json({
            knowledge_id: knowledgeId,
            title: item.title,
            content_type: item.content_type,
            versions: formattedVersions
          });
        }
      } catch (sbErr) {
        console.warn('Supabase version history fetch error:', sbErr);
      }
    }

    // 2. Fallback to SQLite
    const db = getDb();
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
    if (error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'ไม่พบข้อมูลองค์ความรู้นี้' }, { status: 404 });
    }
    if (error.message === 'FORBIDDEN_DEPARTMENT') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึงข้อมูลของฝ่ายอื่น' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
