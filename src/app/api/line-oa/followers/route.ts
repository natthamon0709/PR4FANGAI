import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';
import { pullLatestFromGoogleSheets } from '@/lib/google-sheets-sync';
import { syncFollowersFromLineApiLive, getLineChannelConfig } from '@/lib/line-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    if (session.role !== 'administrator') {
      return NextResponse.json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้น' }, { status: 403 });
    }

    try {
      await pullLatestFromGoogleSheets('LINE_Followers');
    } catch {}

    const db = getDb();
    const config = getLineChannelConfig();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim() || '';
    const statusFilter = searchParams.get('status') || 'all'; // all, linked, guest, blocked

    let query = `
      SELECT 
        f.follower_id,
        f.line_user_id,
        f.display_name,
        f.avatar_url,
        f.linked_master_user_id,
        (u.first_name || ' ' || u.last_name) as linked_user_name,
        u.role as linked_user_role,
        d.name as department_name,
        f.followed_at,
        f.blocked,
        f.last_interaction_at
      FROM line_followers f
      LEFT JOIN master_users u ON f.linked_master_user_id = u.user_id
      LEFT JOIN departments d ON u.department_id = d.department_id
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      conditions.push('(f.display_name LIKE ? OR f.line_user_id LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (statusFilter === 'linked') {
      conditions.push('f.linked_master_user_id IS NOT NULL AND f.blocked = 0');
    } else if (statusFilter === 'guest') {
      conditions.push('f.linked_master_user_id IS NULL AND f.blocked = 0');
    } else if (statusFilter === 'blocked') {
      conditions.push('f.blocked = 1');
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY f.followed_at DESC`;
    const rows = db.prepare(query).all(...params) as any[];

    const followers = rows.map(r => ({
      ...r,
      blocked: Boolean(r.blocked)
    }));

    return NextResponse.json({
      followers,
      botInfo: config ? {
        bot_display_name: config.bot_display_name,
        bot_basic_id: config.bot_basic_id,
        connected: config.webhook_verified
      } : null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Sync Followers LIVE directly from LINE Messaging API
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้น' }, { status: 403 });
    }

    const liveSyncRes = await syncFollowersFromLineApiLive();

    if (!liveSyncRes.success) {
      return NextResponse.json({
        success: false,
        error: liveSyncRes.error || 'ไม่สามารถดึงข้อมูลจาก LINE API ได้'
      }, { status: 400 });
    }

    const db = getDb();
    const rows = db.prepare(`
      SELECT 
        f.follower_id,
        f.line_user_id,
        f.display_name,
        f.avatar_url,
        f.linked_master_user_id,
        (u.first_name || ' ' || u.last_name) as linked_user_name,
        u.role as linked_user_role,
        d.name as department_name,
        f.followed_at,
        f.blocked,
        f.last_interaction_at
      FROM line_followers f
      LEFT JOIN master_users u ON f.linked_master_user_id = u.user_id
      LEFT JOIN departments d ON u.department_id = d.department_id
      ORDER BY f.followed_at DESC
    `).all() as any[];

    const followers = rows.map(r => ({
      ...r,
      blocked: Boolean(r.blocked)
    }));

    return NextResponse.json({
      success: true,
      count: liveSyncRes.count,
      message: `ดึงรายชื่อผู้ติดตามจริงจาก LINE Official Account สำเร็จ (${liveSyncRes.count} คน)`,
      followers
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
