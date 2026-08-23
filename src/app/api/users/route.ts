import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSessionFromRequest, hashPassword } from '@/lib/auth';
import { triggerN8nWebhook } from '@/lib/integrations';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Administrator) เท่านั้น' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const departmentId = searchParams.get('departmentId') || '';
    const role = searchParams.get('role') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const offset = (page - 1) * limit;

    const db = getDb();
    let query = `
      SELECT 
        u.user_id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.department_id,
        u.sub_department_id,
        d.name as department_name,
        s.name as sub_department_name,
        u.role,
        u.status,
        u.avatar_url,
        u.line_user_id,
        u.failed_login_count,
        u.last_login_at,
        u.created_at,
        u.updated_at
      FROM master_users u
      LEFT JOIN departments d ON u.department_id = d.department_id
      LEFT JOIN sub_departments s ON u.sub_department_id = s.sub_department_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    if (departmentId) {
      query += ` AND u.department_id = ?`;
      params.push(departmentId);
    }

    if (role) {
      query += ` AND u.role = ?`;
      params.push(role);
    }

    if (status) {
      query += ` AND u.status = ?`;
      params.push(status);
    }

    // Count total matching
    const countQuery = `SELECT COUNT(*) as total FROM (${query})`;
    const countResult = db.prepare(countQuery).get(...params) as { total: number };
    const total = countResult ? countResult.total : 0;

    // Order & Pagination
    query += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const users = db.prepare(query).all(...params);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    console.error('Fetch users error:', error);
    return NextResponse.json({ error: 'ไม่สามารถดึงข้อมูลรายชื่อผู้ใช้งานได้' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Administrator) เท่านั้น' }, { status: 403 });
    }

    const body = await req.json();
    const { 
      first_name, 
      last_name, 
      email, 
      phone, 
      department_id, 
      sub_department_id, 
      role = 'staff', 
      status = 'active', 
      line_user_id,
      password 
    } = body;

    if (!first_name || !last_name || !email || !department_id || !sub_department_id) {
      return NextResponse.json({ error: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน (ชื่อ, นามสกุล, อีเมล, ฝ่าย, งาน)' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const db = getDb();

    // Check duplicate email
    const existing = db.prepare('SELECT user_id FROM master_users WHERE LOWER(email) = ?').get(cleanEmail);
    if (existing) {
      return NextResponse.json({ error: 'อีเมลนี้มีผู้ใช้งานในระบบแล้ว กรุณาใช้อีเมลอื่น' }, { status: 409 });
    }

    // Generate random temporary password if not provided
    const tempPassword = password || `Fang@${Math.floor(1000 + Math.random() * 9000)}`;
    const passwordHash = await hashPassword(tempPassword);
    const userId = 'usr-' + crypto.randomUUID();

    db.prepare(`
      INSERT INTO master_users (
        user_id, first_name, last_name, email, password_hash,
        phone, department_id, sub_department_id, role, status,
        avatar_url, line_user_id, failed_login_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, 0, datetime('now', 'localtime'), datetime('now', 'localtime'))
    `).run(
      userId,
      first_name.trim(),
      last_name.trim(),
      cleanEmail,
      passwordHash,
      phone ? phone.trim() : null,
      department_id,
      sub_department_id,
      role,
      status,
      line_user_id ? line_user_id.trim() : null
    );

    // Trigger push to Google Sheets (Two-Way Sync Stage/Push)
    const { pushToGoogleSheets } = await import('@/lib/google-sheets-sync');
    pushToGoogleSheets('Master_Users', 'create', {
      user_id: userId,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : null,
      department_code: department_id,
      sub_department_name: sub_department_id,
      role,
      status,
      line_user_id: line_user_id ? line_user_id.trim() : null
    }).catch(err => console.error('Push to Google Sheets error:', err));

    // Trigger n8n webhook notification asynchronously
    triggerN8nWebhook('user.created', {
      user_id: userId,
      email: cleanEmail,
      first_name,
      last_name,
      role,
      department_id
    });

    return NextResponse.json({
      success: true,
      message: 'สร้างบัญชีผู้ใช้งานเรียบร้อยแล้ว',
      user: {
        user_id: userId,
        email: cleanEmail,
        first_name,
        last_name,
        role,
        status,
        tempPassword
      }
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดในการสร้างบัญชีผู้ใช้งาน' }, { status: 500 });
  }
}
