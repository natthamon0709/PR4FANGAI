import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { KnowledgeModel } from '@/models/knowledge.model';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
import getDb from '@/lib/db';

interface RouteParams {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const knowledgeId = params.id;
    const item = await KnowledgeModel.findKnowledgeById(knowledgeId, session);

    if (!item) {
      return NextResponse.json({ error: 'ไม่พบรายการนี้' }, { status: 404 });
    }

    const isAdmin = session.role === 'administrator';
    if (!isAdmin && item.department_id !== session.department_id) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์จัดการข้อมูลของฝ่ายอื่น' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const newStatus = body.status === 'published' ? 'published' : 'archived';
    const now = new Date().toISOString();

    // 1. Supabase
    if (isSupabaseConfigured()) {
      try {
        await supabaseAdmin.from('knowledge_items').update({
          status: newStatus,
          sync_status: 'synced',
          updated_at: now
        }).eq('knowledge_id', knowledgeId);
      } catch (err) {
        console.warn('Supabase archive update warning:', err);
      }
    }

    // 2. SQLite
    try {
      const db = getDb();
      db.prepare(`
        UPDATE knowledge_items 
        SET status = ?, sync_status = 'pending', updated_at = datetime('now', 'localtime')
        WHERE knowledge_id = ?
      `).run(newStatus, knowledgeId);

      db.prepare('DELETE FROM dashboard_summary_cache').run();
    } catch (err) {
      console.warn('SQLite archive update warning:', err);
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      message: newStatus === 'archived' 
        ? 'เก็บองค์ความรู้เข้าคลังเก็บถาวรเรียบร้อยแล้ว (AI จะหยุดใช้ข้อมูลนี้ตอบคำถามทันที)'
        : 'เผยแพร่องค์ความรู้นี้อีกครั้งเรียบร้อยแล้ว'
    });
  } catch (error: any) {
    if (error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'ไม่พบรายการนี้' }, { status: 404 });
    }
    if (error.message === 'FORBIDDEN_DEPARTMENT') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์จัดการข้อมูลของฝ่ายอื่น' }, { status: 403 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
