import crypto from 'crypto';
import getDb from '../lib/db';
import { supabaseAdmin, isSupabaseConfigured } from '../lib/supabase';
import { hashPassword } from '../lib/auth';
import { triggerN8nWebhook } from '../lib/integrations';
import { User, UserWithPassword, SessionUser } from '../types';

export interface UserFilterParams {
  search?: string;
  departmentId?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface UserListResult {
  users: Partial<User>[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateUserData {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string | null;
  department_id: string;
  sub_department_id: string;
  role?: 'administrator' | 'staff';
  status?: 'active' | 'suspended';
  line_user_id?: string | null;
  password?: string;
}

export class UserModel {
  /**
   * Find paginated users with optional search and filters
   */
  static async findUsers(params: UserFilterParams): Promise<UserListResult> {
    const page = Math.max(1, params.page || 1);
    const limit = Math.max(1, Math.min(100, params.limit || 10));
    const offset = (page - 1) * limit;
    const search = params.search?.trim() || '';
    const departmentId = params.departmentId || '';
    const role = params.role || '';
    const status = params.status || '';

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

          return {
            users: formatted,
            pagination: {
              page,
              limit,
              total: sbTotal || 0,
              totalPages: Math.ceil((sbTotal || 0) / limit)
            }
          };
        }
      } catch (err) {
        console.error('Supabase findUsers exception:', err);
      }
    }

    // 2. Fallback to SQLite (with secondary index support)
    const db = getDb();
    let whereClause = 'WHERE 1=1';
    const queryParams: any[] = [];

    if (search) {
      whereClause += ` AND (u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)`;
      const s = `%${search}%`;
      queryParams.push(s, s, s, s);
    }

    if (departmentId) {
      whereClause += ` AND u.department_id = ?`;
      queryParams.push(departmentId);
    }

    if (role) {
      whereClause += ` AND u.role = ?`;
      queryParams.push(role);
    }

    if (status) {
      whereClause += ` AND u.status = ?`;
      queryParams.push(status);
    }

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM master_users u ${whereClause}`).get(...queryParams) as { total: number };
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

    const users = db.prepare(dataQuery).all(...queryParams, limit, offset) as User[];

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find single user by ID
   */
  static async findUserById(userId: string): Promise<(UserWithPassword & { department_name: string; sub_department_name: string }) | null> {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabaseAdmin
          .from('master_users')
          .select('*, departments(name), sub_departments(name)')
          .eq('user_id', userId)
          .maybeSingle();

        if (data && !error) {
          return {
            ...data,
            department_name: (data.departments as any)?.name || '',
            sub_department_name: (data.sub_departments as any)?.name || ''
          };
        }
      } catch {}
    }

    try {
      const db = getDb();
      const row = db.prepare(`
        SELECT u.*, d.name as department_name, s.name as sub_department_name
        FROM master_users u
        LEFT JOIN departments d ON u.department_id = d.department_id
        LEFT JOIN sub_departments s ON u.sub_department_id = s.sub_department_id
        WHERE u.user_id = ?
      `).get(userId) as (UserWithPassword & { department_name: string; sub_department_name: string }) | undefined;
      return row || null;
    } catch {
      return null;
    }
  }

  /**
   * Create new user
   */
  static async createUser(data: CreateUserData): Promise<{ user: Partial<User>; tempPassword?: string }> {
    const cleanEmail = data.email.trim().toLowerCase();
    const db = getDb();

    // Check duplicate
    const existing = db.prepare('SELECT user_id FROM master_users WHERE LOWER(email) = ?').get(cleanEmail);
    if (existing) {
      throw new Error('อีเมลนี้มีผู้ใช้งานในระบบแล้ว กรุณาใช้อีเมลอื่น');
    }

    const tempPassword = data.password || `Fang@${Math.floor(1000 + Math.random() * 9000)}`;
    const passwordHash = await hashPassword(tempPassword);
    const userId = 'usr-' + crypto.randomUUID();
    const role = data.role || 'staff';
    const status = data.status || 'active';

    // Supabase
    if (isSupabaseConfigured()) {
      try {
        await supabaseAdmin.from('master_users').insert({
          user_id: userId,
          first_name: data.first_name.trim(),
          last_name: data.last_name.trim(),
          email: cleanEmail,
          password_hash: passwordHash,
          phone: data.phone ? data.phone.trim() : null,
          department_id: data.department_id,
          sub_department_id: data.sub_department_id,
          role,
          status,
          line_user_id: data.line_user_id ? data.line_user_id.trim() : null,
          failed_login_count: 0
        });
      } catch (sbErr) {
        console.error('Supabase user insert error:', sbErr);
      }
    }

    // SQLite
    db.prepare(`
      INSERT INTO master_users (
        user_id, first_name, last_name, email, password_hash,
        phone, department_id, sub_department_id, role, status,
        avatar_url, line_user_id, failed_login_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, 0, datetime('now', 'localtime'), datetime('now', 'localtime'))
    `).run(
      userId,
      data.first_name.trim(),
      data.last_name.trim(),
      cleanEmail,
      passwordHash,
      data.phone ? data.phone.trim() : null,
      data.department_id,
      data.sub_department_id,
      role,
      status,
      data.line_user_id ? data.line_user_id.trim() : null
    );

    triggerN8nWebhook('user.created', {
      user_id: userId,
      email: cleanEmail,
      first_name: data.first_name,
      last_name: data.last_name,
      role,
      department_id: data.department_id
    });

    return {
      user: {
        user_id: userId,
        email: cleanEmail,
        first_name: data.first_name,
        last_name: data.last_name,
        role,
        status
      },
      tempPassword
    };
  }

  /**
   * Update user with authorization rules
   */
  static async updateUser(
    targetUserId: string,
    updates: Partial<User>,
    actorSession: SessionUser
  ): Promise<boolean> {
    const isAdmin = actorSession.role === 'administrator';
    const isSelf = actorSession.user_id === targetUserId;

    if (!isAdmin && !isSelf) {
      throw new Error('ไม่มีสิทธิ์แก้ไขข้อมูลผู้ใช้งานรายนี้');
    }

    const existing = await this.findUserById(targetUserId);
    if (!existing) {
      throw new Error('ไม่พบผู้ใช้งาน');
    }

    // Non-admins cannot elevate privileges or reassign departments
    const newRole = isAdmin && updates.role ? updates.role : existing.role;
    const newStatus = isAdmin && updates.status ? updates.status : existing.status;
    const newDept = isAdmin && updates.department_id ? updates.department_id : existing.department_id;
    const newSubDept = isAdmin && updates.sub_department_id ? updates.sub_department_id : existing.sub_department_id;
    const cleanFirst = updates.first_name ? updates.first_name.trim() : existing.first_name;
    const cleanLast = updates.last_name ? updates.last_name.trim() : existing.last_name;
    const cleanPhone = updates.phone !== undefined ? (updates.phone ? updates.phone.trim() : null) : existing.phone;
    const cleanLine = updates.line_user_id !== undefined ? (updates.line_user_id ? updates.line_user_id.trim() : null) : existing.line_user_id;

    // Supabase
    if (isSupabaseConfigured()) {
      try {
        await supabaseAdmin.from('master_users').update({
          first_name: cleanFirst,
          last_name: cleanLast,
          phone: cleanPhone,
          department_id: newDept,
          sub_department_id: newSubDept,
          role: newRole,
          status: newStatus,
          line_user_id: cleanLine,
          updated_at: new Date().toISOString()
        }).eq('user_id', targetUserId);
      } catch {}
    }

    // SQLite
    const db = getDb();
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
      cleanFirst,
      cleanLast,
      cleanPhone,
      newDept,
      newSubDept,
      newRole,
      newStatus,
      cleanLine,
      targetUserId
    );

    triggerN8nWebhook('user.updated', {
      user_id: targetUserId,
      role: newRole,
      status: newStatus
    });

    return true;
  }

  /**
   * Delete user
   */
  static async deleteUser(targetUserId: string, actorSession: SessionUser): Promise<boolean> {
    if (actorSession.role !== 'administrator') {
      throw new Error('สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Administrator) เท่านั้น');
    }

    if (actorSession.user_id === targetUserId) {
      throw new Error('ไม่สามารถลบบัญชีของตนเองที่กำลังเข้าสู่ระบบอยู่ได้');
    }

    // Supabase
    if (isSupabaseConfigured()) {
      try {
        await supabaseAdmin.from('master_users').delete().eq('user_id', targetUserId);
      } catch {}
    }

    // SQLite
    const db = getDb();
    const result = db.prepare('DELETE FROM master_users WHERE user_id = ?').run(targetUserId);
    if (result.changes === 0) {
      throw new Error('ไม่พบบัญชีผู้ใช้งานที่ต้องการลบ');
    }

    triggerN8nWebhook('user.deleted', { user_id: targetUserId });
    return true;
  }
}
