import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { KnowledgeModel } from '@/models/knowledge.model';

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const item = await KnowledgeModel.findKnowledgeById(params.id, session);
    return NextResponse.json({ item });
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_DEPARTMENT') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึงข้อมูลร่างของฝ่ายอื่น' }, { status: 403 });
    }
    if (error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'ไม่พบข้อมูลองค์ความรู้นี้' }, { status: 404 });
    }
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด: ' + error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const body = await req.json();
    await KnowledgeModel.updateKnowledgeItem(params.id, body, session);

    return NextResponse.json({
      success: true,
      message: 'บันทึกการแก้ไขเรียบร้อยแล้ว'
    });
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_DEPARTMENT') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์แก้ไของค์ความรู้ของฝ่ายอื่น' }, { status: 403 });
    }
    if (error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'ไม่พบข้อมูลองค์ความรู้นี้' }, { status: 404 });
    }
    return NextResponse.json({ error: 'แก้ไขไม่สำเร็จ: ' + error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const result = await KnowledgeModel.deleteOrArchiveKnowledgeItem(params.id, session);

    return NextResponse.json({
      success: true,
      message: result.action === 'deleted' 
        ? 'ลบองค์ความรู้เรียบร้อยแล้ว' 
        : 'เก็บองค์ความรู้นี้เข้าคลังเก็บถาวร (Archived) เรียบร้อยแล้ว'
    });
  } catch (error: any) {
    if (error.message === 'FORBIDDEN_DEPARTMENT') {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์จัดการองค์ความรู้ของฝ่ายอื่น' }, { status: 403 });
    }
    if (error.message === 'NOT_FOUND') {
      return NextResponse.json({ error: 'ไม่พบข้อมูลองค์ความรู้นี้' }, { status: 404 });
    }
    return NextResponse.json({ error: 'ดำเนินการไม่สำเร็จ: ' + error.message }, { status: 500 });
  }
}
