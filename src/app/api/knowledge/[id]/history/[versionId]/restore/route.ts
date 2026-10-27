import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { KnowledgeModel } from '@/models/knowledge.model';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import getDb from '@/lib/db';

interface RouteParams {
  params: { id: string; versionId: string };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const knowledgeId = params.id;
    const versionId = params.versionId;

    const currentItem = await KnowledgeModel.findKnowledgeById(knowledgeId, session);
    if (!currentItem) {
      return NextResponse.json({ error: 'ไม่พบองค์ความรู้นี้' }, { status: 404 });
    }

    const isAdmin = session.role === 'administrator';
    if (!isAdmin && currentItem.department_id !== session.department_id) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์กู้คืนข้อมูลของฝ่ายอื่น' }, { status: 403 });
    }

    let targetVersion: any = null;

    // 1. Try Supabase
    if (isSupabaseConfigured()) {
      try {
        const { data: sbVer, error: sbErr } = await supabaseAdmin
          .from('knowledge_version_history')
          .select('*')
          .eq('version_id', versionId)
          .eq('knowledge_id', knowledgeId)
          .maybeSingle();

        if (!sbErr && sbVer) {
          targetVersion = sbVer;
        }
      } catch (sbErr) {
        console.warn('Supabase find version error:', sbErr);
      }
    }

    // 2. Fallback to SQLite
    if (!targetVersion) {
      const db = getDb();
      targetVersion = db.prepare('SELECT * FROM knowledge_version_history WHERE version_id = ? AND knowledge_id = ?').get(versionId, knowledgeId) as any;
    }

    if (!targetVersion) {
      return NextResponse.json({ error: 'ไม่พบประวัติเวอร์ชันที่ต้องการกู้คืน' }, { status: 404 });
    }

    let parsedTags: string[] = [];
    try {
      parsedTags = JSON.parse(targetVersion.tags_snapshot || '[]');
    } catch {
      parsedTags = targetVersion.tags_snapshot ? [targetVersion.tags_snapshot] : [];
    }

    await KnowledgeModel.updateKnowledgeItem(knowledgeId, {
      title: targetVersion.title_snapshot,
      summary: targetVersion.summary_snapshot || '',
      content: targetVersion.content_snapshot,
      tags: parsedTags
    }, session);

    return NextResponse.json({
      success: true,
      message: `กู้คืนข้อมูลกลับสู่เนื้อหาเวอร์ชัน v${targetVersion.version_no} เรียบร้อยแล้ว`
    });
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'ไม่พบองค์ความรู้นี้' }, { status: 404 });
    }
    if (error.message === 'FORBIDDEN_DEPARTMENT') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์กู้คืนข้อมูลของฝ่ายอื่น' }, { status: 403 });
    }
    return NextResponse.json({ error: 'กู้คืนไม่สำเร็จ: ' + error.message }, { status: 500 });
  }
}
