import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'pr4fang_ai_super_secret_jwt_key_2026_community_college';
const secretKey = new TextEncoder().encode(JWT_SECRET);
const COOKIE_NAME = 'pr4fang_session';

// Public paths that do not require authentication
const PUBLIC_PAGE_PREFIXES = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/robot',
  '/robot-reception',
  '/playground/robot'
];

const PUBLIC_API_PREFIXES = [
  '/api/auth/login',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/departments',
  '/api/robot',
  '/api/audio',
  '/api/media-proxy',
  '/api/line-oa/webhook',
  '/api/v1/n8n'
];

// Admin-only page routes
const ADMIN_ONLY_PAGES = [
  '/users',
  '/audit-logs',
  '/integrations',
  '/line-oa/rich-menu',
  '/line-oa/followers',
  '/ai-engine/settings'
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Skip static assets, Next.js internal files, and public images
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/img') ||
    pathname.startsWith('/audio') ||
    pathname === '/favicon.ico' ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Allow public pages
  const isPublicPage = PUBLIC_PAGE_PREFIXES.some(prefix => 
    pathname === prefix || pathname.startsWith(prefix + '/')
  );
  if (isPublicPage) {
    return NextResponse.next();
  }

  // 3. Allow public APIs
  const isPublicApi = PUBLIC_API_PREFIXES.some(prefix => 
    pathname === prefix || pathname.startsWith(prefix + '/')
  );
  if (isPublicApi) {
    return NextResponse.next();
  }

  // 4. Verify JWT token from cookie or Authorization header
  let token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    const authHeader = req.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }

  // 5. If no token found
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }
    const loginUrl = new URL('/login', req.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  // 6. Verify token validity
  try {
    const { payload } = await jwtVerify(token, secretKey);
    const user = payload.user as { role?: string; user_id?: string; status?: string } | undefined;

    if (!user || user.status === 'suspended') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'บัญชีถูกระงับหรือไม่มีอยู่ในระบบ' }, { status: 403 });
      }
      const response = NextResponse.redirect(new URL('/login', req.url));
      response.cookies.delete(COOKIE_NAME);
      return response;
    }

    const isAdmin = user.role === 'administrator';

    // 7. Check Admin-only Page restrictions
    const isAdminOnlyPage = ADMIN_ONLY_PAGES.some(prefix => 
      pathname === prefix || pathname.startsWith(prefix + '/')
    ) || (pathname.startsWith('/settings') && pathname !== '/settings/my-preferences');

    if (isAdminOnlyPage && !isAdmin) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'สงวนสิทธิ์เฉพาะผู้ดูแลระบบ (Administrator) เท่านั้น' }, { status: 403 });
      }
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  } catch (err) {
    // Token is invalid or expired
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่' }, { status: 401 });
    }
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete(COOKIE_NAME);
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
