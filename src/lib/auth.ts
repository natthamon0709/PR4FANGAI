import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import getDb from './db';
import { supabaseAdmin } from './supabase';
import { SessionUser, UserWithPassword } from '@/types';

const JWT_SECRET = process.env.JWT_SECRET || 'pr4fang_ai_super_secret_jwt_key_2026_community_college';
const secretKey = new TextEncoder().encode(JWT_SECRET);
const COOKIE_NAME = 'pr4fang_session';

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MINUTES = 15;
export const SESSION_DURATION_HOURS = 24; // 24 ชั่วโมง
export const REMEMBER_ME_DURATION_DAYS = 30; // 30 วันสำหรับ จดจำการเข้าสู่ระบบ

// 1. Password utilities
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// 2. JWT Session utilities
export async function createSessionToken(user: SessionUser, rememberMe = false): Promise<string> {
  const expiration = rememberMe ? `${REMEMBER_ME_DURATION_DAYS}d` : `${SESSION_DURATION_HOURS}h`;
  return new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiration)
    .sign(secretKey);
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey);
    return (payload.user as SessionUser) || null;
  } catch (error) {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch (err) {
    return null;
  }
}

export async function getSessionFromRequest(req: NextRequest): Promise<SessionUser | null> {
  try {
    // Check Authorization header first
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      return await verifySessionToken(token);
    }
    // Check cookie
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifySessionToken(token);
  } catch (err) {
    return null;
  }
}

// 3. User & Auth Database Operations (Supabase PostgreSQL with SQLite fallback)
export async function getUserByEmail(email: string): Promise<(UserWithPassword & { department_name: string; sub_department_name: string }) | null> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Try Supabase
  try {
    const { data, error } = await supabaseAdmin
      .from('master_users')
      .select('*, departments(name), sub_departments(name)')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (data && !error) {
      return {
        ...data,
        department_name: (data.departments as any)?.name || '',
        sub_department_name: (data.sub_departments as any)?.name || ''
      };
    }
  } catch (supabaseErr) {
    // Supabase query failed or table not found, proceed to fallback
  }

  // 2. Fallback to SQLite
  try {
    const db = getDb();
    const row = db.prepare(`
      SELECT u.*, d.name as department_name, s.name as sub_department_name
      FROM master_users u
      LEFT JOIN departments d ON u.department_id = d.department_id
      LEFT JOIN sub_departments s ON u.sub_department_id = s.sub_department_id
      WHERE LOWER(u.email) = LOWER(?)
    `).get(cleanEmail) as (UserWithPassword & { department_name: string; sub_department_name: string }) | undefined;
    return row || null;
  } catch {
    return null;
  }
}

export async function getUserById(userId: string): Promise<(UserWithPassword & { department_name: string; sub_department_name: string }) | null> {
  // 1. Try Supabase
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

  // 2. Fallback to SQLite
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

export async function logLoginAttempt(
  userId: string | null,
  email: string,
  result: 'success' | 'failed_password' | 'account_suspended' | 'account_locked',
  ipAddress: string
) {
  const logId = 'log-' + crypto.randomUUID();

  // Supabase
  try {
    await supabaseAdmin.from('login_audit_logs').insert({
      log_id: logId,
      user_id: userId,
      email_attempted: email,
      result,
      ip_address: ipAddress
    });
  } catch {}

  // SQLite
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO login_audit_logs (log_id, user_id, email_attempted, result, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `).run(logId, userId, email, result, ipAddress);
  } catch {}
}

export async function handleFailedLogin(userId: string, currentFailCount: number) {
  const newFailCount = currentFailCount + 1;
  let lockedUntil: string | null = null;

  if (newFailCount >= MAX_FAILED_ATTEMPTS) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + LOCKOUT_DURATION_MINUTES);
    lockedUntil = now.toISOString();
  }

  // Supabase
  try {
    await supabaseAdmin.from('master_users').update({
      failed_login_count: newFailCount,
      locked_until: lockedUntil,
      updated_at: new Date().toISOString()
    }).eq('user_id', userId);
  } catch {}

  // SQLite
  try {
    const db = getDb();
    db.prepare(`
      UPDATE master_users
      SET failed_login_count = ?, locked_until = ?, updated_at = datetime('now', 'localtime')
      WHERE user_id = ?
    `).run(newFailCount, lockedUntil, userId);
  } catch {}

  return { newFailCount, isLocked: newFailCount >= MAX_FAILED_ATTEMPTS, lockedUntil };
}

export async function handleSuccessfulLogin(userId: string) {
  // Supabase
  try {
    await supabaseAdmin.from('master_users').update({
      failed_login_count: 0,
      locked_until: null,
      last_login_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('user_id', userId);
  } catch {}

  // SQLite
  try {
    const db = getDb();
    db.prepare(`
      UPDATE master_users
      SET failed_login_count = 0, locked_until = NULL, last_login_at = datetime('now', 'localtime'), updated_at = datetime('now', 'localtime')
      WHERE user_id = ?
    `).run(userId);
  } catch {}
}

// 4. Password Reset Token Operations
export async function createPasswordResetToken(userId: string): Promise<string> {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const tokenId = 'tok-' + crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

  // Supabase
  try {
    await supabaseAdmin.from('reset_password_tokens').update({ used: 1 }).eq('user_id', userId);
    await supabaseAdmin.from('reset_password_tokens').insert({
      token_id: tokenId,
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
      used: 0
    });
  } catch {}

  // SQLite
  try {
    const db = getDb();
    db.prepare(`UPDATE reset_password_tokens SET used = 1 WHERE user_id = ?`).run(userId);
    db.prepare(`
      INSERT INTO reset_password_tokens (token_id, user_id, token_hash, expires_at, used, created_at)
      VALUES (?, ?, ?, ?, 0, datetime('now', 'localtime'))
    `).run(tokenId, userId, tokenHash, expiresAt);
  } catch {}

  return rawToken;
}

export async function verifyPasswordResetToken(rawToken: string): Promise<{ valid: boolean; userId?: string; error?: string }> {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  // 1. Try Supabase
  try {
    const { data, error } = await supabaseAdmin
      .from('reset_password_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .eq('used', 0)
      .maybeSingle();

    if (data && !error) {
      const expires = new Date(data.expires_at).getTime();
      if (Date.now() > expires) {
        return { valid: false, error: 'ลิงก์รีเซ็ตรหัสผ่านหมดอายุแล้ว (อายุการใช้งาน 30 นาที)' };
      }
      return { valid: true, userId: data.user_id };
    }
  } catch {}

  // 2. Fallback SQLite
  try {
    const db = getDb();
    const tokenRecord = db.prepare(`
      SELECT * FROM reset_password_tokens
      WHERE token_hash = ? AND used = 0
    `).get(tokenHash) as { token_id: string; user_id: string; expires_at: string } | undefined;

    if (!tokenRecord) {
      return { valid: false, error: 'ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือถูกใช้งานไปแล้ว' };
    }

    const expires = new Date(tokenRecord.expires_at).getTime();
    if (Date.now() > expires) {
      return { valid: false, error: 'ลิงก์รีเซ็ตรหัสผ่านหมดอายุแล้ว (อายุการใช้งาน 30 นาที)' };
    }

    return { valid: true, userId: tokenRecord.user_id };
  } catch {
    return { valid: false, error: 'เกิดข้อผิดพลาดในการตรวจสอบโทเค็น' };
  }
}

export async function consumePasswordResetToken(rawToken: string, newPasswordHash: string): Promise<boolean> {
  const verification = await verifyPasswordResetToken(rawToken);
  if (!verification.valid || !verification.userId) return false;

  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  // Supabase
  try {
    await supabaseAdmin.from('reset_password_tokens').update({ used: 1 }).eq('token_hash', tokenHash);
    await supabaseAdmin.from('master_users').update({
      password_hash: newPasswordHash,
      failed_login_count: 0,
      locked_until: null,
      updated_at: new Date().toISOString()
    }).eq('user_id', verification.userId);
  } catch {}

  // SQLite
  try {
    const db = getDb();
    const update = db.transaction(() => {
      db.prepare(`UPDATE reset_password_tokens SET used = 1 WHERE token_hash = ?`).run(tokenHash);
      db.prepare(`
        UPDATE master_users
        SET password_hash = ?, failed_login_count = 0, locked_until = NULL, updated_at = datetime('now', 'localtime')
        WHERE user_id = ?
      `).run(newPasswordHash, verification.userId);
    });
    update();
  } catch {}

  return true;
}

export { COOKIE_NAME };
