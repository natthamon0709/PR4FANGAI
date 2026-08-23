import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { createAccountLinkCode } from '@/lib/line-service';

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
