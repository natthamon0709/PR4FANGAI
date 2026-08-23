import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, getUserById } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const latestUser = getUserById(session.user_id);
    if (!latestUser || latestUser.status === 'suspended') {
      return NextResponse.json({ authenticated: false, error: 'บัญชีถูกระงับหรือไม่มีอยู่ในระบบ' }, { status: 403 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        user_id: latestUser.user_id,
        first_name: latestUser.first_name,
        last_name: latestUser.last_name,
        email: latestUser.email,
        phone: latestUser.phone,
        role: latestUser.role,
        status: latestUser.status,
        department_id: latestUser.department_id,
        sub_department_id: latestUser.sub_department_id,
        department_name: latestUser.department_name,
        sub_department_name: latestUser.sub_department_name,
        avatar_url: latestUser.avatar_url,
        line_user_id: latestUser.line_user_id,
        last_login_at: latestUser.last_login_at
      }
    });
  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
