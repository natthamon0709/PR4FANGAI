import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSessionFromRequest, hashPassword } from '@/lib/auth';
import { triggerN8nWebhook } from '@/lib/integrations';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase';
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

    // 1. Try Supabase
    if (isSupabaseConfigured()) {
      try {
        let sbQuery = supabaseAdmin
          .from('master_users')
          .select('*, departments(name), sub_departments(name)', { count: 'exact' });

        if (search) {
          sbQuery = sbQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
        }
        if (departmentId) {
          sbQuery = sbQuery.eq('department_id', departmentId);
        }
        if (role) {
          sbQuery = sbQuery.eq('role', role);
        }
        if (status) {
          sbQuery = sbQuery.eq('status', status);
        }

        const { data: sbUsers, count: sbTotal, error: sbErr } = await sbQuery
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (!sbErr && sbUsers) {
          const formatted = sbUsers.map(u => ({
            ...u,
            department_name: (u.departments as any)?.name || '',
            sub_department_name: (u.sub_departments as any)?.name || ''
          }));

          return NextResponse.json({
            users: formatted,
            pagination: {
              page,
              limit,
              total: sbTotal || 0,
              totalPages: Math.ceil((sbTotal || 0) / limit)
            }
          });
        }
        if (sbErr) {
          console.error('Supabase fetch users error:', sbErr);
        }
      } catch (err) {
        console.error('Supabase users query exception:', err);
      }
    }

    // 2. Fallback to SQLite
    const db = getDb();
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }

    if (departmentId) {
      whereClause += ` AND u.department_id = ?`;
      params.push(departmentId);
    }

    if (role) {
      whereClause += ` AND u.role = ?`;
      params.push(role);
    }

    if (status) {
      whereClause += ` AND u.status = ?`;
      params.push(status);
    }

    // Count total matching
    const countResult = db.prepare(`SELECT COUNT(*) as total FROM master_users u ${whereClause}`).get(...params) as { total: number };
    const total = countResult ? countResult.total : 0;

    const dataQuery = `
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
      ${whereClause}
      ORDER BY u.created_at DESC LIMIT ? OFFSET ?
    `;

    const users = db.prepare(dataQuery).all(...params, limit, offset);

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
    return NextResponse.json({ error: error?.message || 'ไม่สามารถดึงข้อมูลรายชื่อผู้ใช้งานได้' }, { status: 500 });
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

    // 1. Check duplicate in Supabase
    try {
      const { data: existingSb } = await supabaseAdmin
        .from('master_users')
        .select('user_id')
        .ilike('email', cleanEmail)
        .maybeSingle();

      if (existingSb) {
        return NextResponse.json({ error: 'อีเมลนี้มีผู้ใช้งานในระบบแล้ว กรุณาใช้อีเมลอื่น' }, { status: 409 });
      }
    } catch {}

    const db = getDb();

    // Check duplicate in SQLite
    try {
      const existing = db.prepare('SELECT user_id FROM master_users WHERE LOWER(email) = ?').get(cleanEmail);
      if (existing) {
        return NextResponse.json({ error: 'อีเมลนี้มีผู้ใช้งานในระบบแล้ว กรุณาใช้อีเมลอื่น' }, { status: 409 });
      }
    } catch {}

    // Generate random temporary password if not provided
    const tempPassword = password || `Fang@${Math.floor(1000 + Math.random() * 9000)}`;
    const passwordHash = await hashPassword(tempPassword);
    const userId = 'usr-' + crypto.randomUUID();

    // Supabase Insert
    try {
      await supabaseAdmin.from('master_users').insert({
        user_id: userId,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        email: cleanEmail,
        password_hash: passwordHash,
        phone: phone ? phone.trim() : null,
        department_id,
        sub_department_id,
        role,
        status,
        line_user_id: line_user_id ? line_user_id.trim() : null,
        failed_login_count: 0
      });
    } catch (sbErr) {
      console.error('Supabase user insert error:', sbErr);
    }

    // SQLite Insert
    try {
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
    } catch {}

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
