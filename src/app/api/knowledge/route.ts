import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { KnowledgeModel } from '@/models/knowledge.model';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const contentType = searchParams.get('type') || searchParams.get('content_type') || 'all';
    const departmentId = searchParams.get('department_id') || '';
    const subDepartmentId = searchParams.get('sub_department_id') || '';
    const status = searchParams.get('status') || 'all';
    const includeArchived = Boolean(searchParams.get('include_archived'));
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '10')));

    const result = await KnowledgeModel.findKnowledgeItems({
      search,
      contentType,
      departmentId,
      subDepartmentId,
      status,
      includeArchived,
      page,
      limit
    }, session);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Fetch knowledge error:', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลองค์ความรู้ได้: ' + error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const body = await req.json();
    const {
      content_type,
      title,
      summary,
      content,
      department_id,
      sub_department_id,
      tags = [],
      status = 'published',
      effective_date = null,
      expiry_date = null,
      ai_retrieval_enabled = true,
      attachments = []
    } = body;

    // Validation
    if (!content_type || !title || !summary || !content) {
      return NextResponse.json({ error: 'กรุณากรอกประเภทข้อมูล, หัวข้อเรื่อง, สรุปย่อ และเนื้อหาให้ครบถ้วน' }, { status: 400 });
    }

    const knowledgeId = await KnowledgeModel.createKnowledgeItem({
      content_type,
      title,
      summary,
      content,
      department_id,
      sub_department_id,
      tags,
      status,
      effective_date,
      expiry_date,
      ai_retrieval_enabled,
      attachments
    }, session);

    return NextResponse.json({
      success: true,
      message: 'บันทึกองค์ความรู้ลงฐานข้อมูลเรียบร้อยแล้ว',
      knowledge_id: knowledgeId
    }, { status: 201 });
  } catch (error: any) {
    console.error('Create knowledge error:', error);
    return NextResponse.json({ error: 'ไม่สามารถบันทึกองค์ความรู้ได้: ' + error.message }, { status: 500 });
  }
}
