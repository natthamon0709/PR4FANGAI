import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { createAccountLinkCode } from '@/lib/line-service';
import getDb from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const user = db.prepare('SELECT line_user_id FROM master_users WHERE user_id = ?').get(session.user_id) as any;
    const latestReq = db.prepare('SELECT * FROM line_account_link_requests WHERE master_user_id = ? ORDER BY created_at DESC LIMIT 1').get(session.user_id) as any;

    return NextResponse.json({
      line_user_id: user?.line_user_id || null,
      is_linked: Boolean(user?.line_user_id),
      latest_request: latestReq || null
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const request = createAccountLinkCode(session.user_id);

    return NextResponse.json({
      success: true,
      request: {
        request_id: request.request_id,
        verification_code: request.verification_code,
        expires_at: request.expires_at,
        expires_in_seconds: 600
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
