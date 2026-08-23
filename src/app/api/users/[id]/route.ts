import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, getUserById } from '@/lib/auth';
import { triggerN8nWebhook } from '@/lib/integrations';
import getDb from '@/lib/db';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    // Staff can only view their own info, Admin can view anyone
    if (session.role !== 'administrator' && session.user_id !== params.id) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์เข้าถึงข้อมูลผู้ใช้งานรายนี้' }, { status: 403 });
    }

    const user = getUserById(params.id);
    if (!user) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้งานนี้ในระบบ' }, { status: 404 });
    }

    const { password_hash, ...safeUser } = user;
    return NextResponse.json({ user: safeUser });
  } catch (error) {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const isAdmin = session.role === 'administrator';
    const isSelf = session.user_id === params.id;

    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: 'ไม่มีสิทธิ์แก้ไขข้อมูลผู้ใช้งานรายนี้' }, { status: 403 });
    }

    const body = await req.json();
    const { 
      first_name, 
      last_name, 
      phone, 
      department_id, 
      sub_department_id, 
      role, 
      status, 
      line_user_id 
    } = body;

    const db = getDb();
    const existing = getUserById(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'ไม่พบผู้ใช้งาน' }, { status: 404 });
    }

    // Non-admin cannot change their own role or status or department
    const newRole = isAdmin && role ? role : existing.role;
    const newStatus = isAdmin && status ? status : existing.status;
    const newDept = isAdmin && department_id ? department_id : existing.department_id;
    const newSubDept = isAdmin && sub_department_id ? sub_department_id : existing.sub_department_id;

    db.prepare(`
      UPDATE master_users
      SET 
        first_name = ?,
        last_name = ?,
        phone = ?,
        department_id = ?,
        sub_department_id = ?,
        role = ?,
        status = ?,
        line_user_id = ?,
        updated_at = datetime('now', 'localtime')
      WHERE user_id = ?
    `).run(
      first_name ? first_name.trim() : existing.first_name,
      last_name ? last_name.trim() : existing.last_name,
      phone !== undefined ? (phone ? phone.trim() : null) : existing.phone,
      newDept,
      newSubDept,
      newRole,
      newStatus,
      line_user_id !== undefined ? (line_user_id ? line_user_id.trim() : null) : existing.line_user_id,
      params.id
    );

    // Push update to Google Sheets
    try {
      const { pushToGoogleSheets } = await import('@/lib/google-sheets-sync');
      const deptRow = db.prepare('SELECT name FROM departments WHERE department_id = ?').get(newDept) as any;
      const subDeptRow = db.prepare('SELECT name FROM sub_departments WHERE sub_department_id = ?').get(newSubDept) as any;

      pushToGoogleSheets('Master_Users', 'update', {
        user_id: params.id,
        first_name: (first_name ? first_name.trim() : existing.first_name),
        last_name: (last_name ? last_name.trim() : existing.last_name),
        email: existing.email,
        phone: (phone !== undefined ? (phone ? phone.trim() : null) : existing.phone),
        department_name: deptRow?.name || newDept,
        sub_department_name: subDeptRow?.name || newSubDept,
        role: newRole,
        status: newStatus,
        line_user_id: (line_user_id !== undefined ? (line_user_id ? line_user_id.trim() : null) : existing.line_user_id)
      }).catch(err => console.error('Push update to Google Sheets error:', err));
    } catch {}

    triggerN8nWebhook('user.updated', {
      user_id: params.id,
      role: newRole,
      status: newStatus
    });

    return NextResponse.json({
      success: true,
      message: 'บันทึกการแก้ไขข้อมูลผู้ใช้งานเรียบร้อยแล้ว'
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้งาน' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Administrator) เท่านั้น' }, { status: 403 });
    }

    if (session.user_id === params.id) {
      return NextResponse.json({ error: 'ไม่สามารถลบบัญชีของตนเองที่กำลังเข้าสู่ระบบอยู่ได้' }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare('SELECT * FROM master_users WHERE user_id = ?').get(params.id) as any;
    const result = db.prepare('DELETE FROM master_users WHERE user_id = ?').run(params.id);

    if (result.changes === 0) {
      return NextResponse.json({ error: 'ไม่พบบัญชีผู้ใช้งานที่ต้องการลบ' }, { status: 404 });
    }

    // Push deletion to Google Sheets
    try {
      const { pushToGoogleSheets } = await import('@/lib/google-sheets-sync');
      pushToGoogleSheets('Master_Users', 'delete', {
        user_id: params.id,
        email: existing?.email
      }).catch(err => console.error('Push delete to Google Sheets error:', err));
    } catch {}

    triggerN8nWebhook('user.deleted', { user_id: params.id });

    return NextResponse.json({
      success: true,
      message: 'ลบบัญชีผู้ใช้งานเรียบร้อยแล้ว'
    });
  } catch (error) {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการลบบัญชีผู้ใช้งาน' }, { status: 500 });
  }
}
