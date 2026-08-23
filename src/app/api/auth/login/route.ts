import { NextRequest, NextResponse } from 'next/server';
import { 
  getUserByEmail, 
  verifyPassword, 
  createSessionToken, 
  handleFailedLogin, 
  handleSuccessfulLogin, 
  logLoginAttempt,
  COOKIE_NAME,
  MAX_FAILED_ATTEMPTS
} from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, rememberMe } = await req.json();
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    if (!email || !password) {
      return NextResponse.json({ error: 'กรุณากรอกอีเมลและรหัสผ่าน' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = getUserByEmail(cleanEmail);

    if (!user) {
      logLoginAttempt(null, cleanEmail, 'failed_password', ip);
      return NextResponse.json({ 
        error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' 
      }, { status: 401 });
    }

    // Check account lockout
    if (user.locked_until) {
      const lockedTime = new Date(user.locked_until).getTime();
      if (Date.now() < lockedTime) {
        const remainingMinutes = Math.ceil((lockedTime - Date.now()) / (1000 * 60));
        logLoginAttempt(user.user_id, cleanEmail, 'account_locked', ip);
        return NextResponse.json({ 
          error: `บัญชีถูกระงับชั่วคราวเนื่องจากใส่รหัสผ่านผิดเกินกำหนด กรุณารอ ${remainingMinutes} นาที หรือติดต่อผู้ดูแลระบบ` 
        }, { status: 423 });
      }
    }

    // Check account suspended
    if (user.status === 'suspended') {
      logLoginAttempt(user.user_id, cleanEmail, 'account_suspended', ip);
      return NextResponse.json({ 
        error: 'บัญชีถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ ฝ่ายยุทธศาสตร์และแผนงาน (งานศูนย์ดิจิทัลและสื่อสารองค์กร)' 
      }, { status: 403 });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      const { newFailCount, isLocked } = handleFailedLogin(user.user_id, user.failed_login_count);
      logLoginAttempt(user.user_id, cleanEmail, 'failed_password', ip);
      
      const attemptsLeft = Math.max(0, MAX_FAILED_ATTEMPTS - newFailCount);
      if (isLocked) {
        return NextResponse.json({ 
          error: 'ใส่รหัสผ่านผิดครบ 5 ครั้ง บัญชีถูกล็อกชั่วคราวเป็นเวลา 15 นาที' 
        }, { status: 423 });
      } else {
        return NextResponse.json({ 
          error: `อีเมลหรือรหัสผ่านไม่ถูกต้อง (เหลือโอกาสอีก ${attemptsLeft} ครั้ง)` 
        }, { status: 401 });
      }
    }

    // Successful login
    handleSuccessfulLogin(user.user_id);
    logLoginAttempt(user.user_id, cleanEmail, 'success', ip);

    const sessionPayload = {
      user_id: user.user_id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      role: user.role,
      status: user.status,
      department_id: user.department_id,
      sub_department_id: user.sub_department_id,
      department_name: user.department_name,
      sub_department_name: user.sub_department_name,
      avatar_url: user.avatar_url,
      line_user_id: user.line_user_id
    };

    const token = await createSessionToken(sessionPayload);

    // 2 hours maxAge or 7 days if rememberMe
    const maxAgeSeconds = rememberMe ? 7 * 24 * 60 * 60 : 2 * 60 * 60;

    const response = NextResponse.json({
      success: true,
      message: 'เข้าสู่ระบบสำเร็จ',
      user: sessionPayload,
      token
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeSeconds
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง' }, { status: 500 });
  }
}
