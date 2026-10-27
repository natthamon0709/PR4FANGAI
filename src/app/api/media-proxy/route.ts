import { NextRequest, NextResponse } from 'next/server';

/**
 * Image / Media Proxy Route
 * ใช้สำหรับดึงรูปภาพจาก Google Drive (lh3.googleusercontent.com / drive.google.com)
 * เพื่อป้องกันปัญหา Browser CORS & Referer 403 Forbidden ทำให้รูปภาพแสดงผลได้ทั้งใน Playground และ Robot
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Validate URL and enforce SSRF whitelist protection
  let parsed: URL;
  try {
    parsed = new URL(targetUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid target URL format' }, { status: 400 });
  }

  // Block localhost, internal IP ranges, metadata services
  const hostname = parsed.hostname.toLowerCase();
  const isPrivateOrLoopback = 
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '0.0.0.0' ||
    hostname === '169.254.169.254' ||
    hostname.startsWith('10.') ||
    hostname.startsWith('192.168.') ||
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal');

  if (isPrivateOrLoopback) {
    return NextResponse.json({ error: 'Access to internal network addresses is forbidden' }, { status: 403 });
  }

  // Allowed domain whitelist for proxying
  const isAllowedHost = 
    hostname === 'drive.google.com' ||
    hostname === 'docs.google.com' ||
    hostname.endsWith('.googleusercontent.com') ||
    hostname.endsWith('.supabase.co') ||
    hostname === 'images.unsplash.com';

  if (!isAllowedHost) {
    return NextResponse.json({ error: 'Domain not allowed for media proxy' }, { status: 403 });
  }

  try {
    // ดึง file id หากเป็น Google Drive URL
    let fetchUrl = targetUrl;
    const fileIdMatch = targetUrl.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/) ||
                        targetUrl.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/) ||
                        targetUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);

    if (fileIdMatch && fileIdMatch[1]) {
      const fileId = fileIdMatch[1];
      fetchUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
    }

    // Fetch จาก Google Drive โดยไม่ส่ง Referer ของ Browser
    const response = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      },
      next: { revalidate: 3600 } // cache 1 hour
    });

    if (!response.ok) {
      // Fallback ลอง fetch ผ่าน thumbnail endpoint
      if (fileIdMatch && fileIdMatch[1]) {
        const thumbRes = await fetch(`https://drive.google.com/thumbnail?id=${fileIdMatch[1]}&sz=w1200`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          }
        });
        if (thumbRes.ok) {
          const buffer = await thumbRes.arrayBuffer();
          const contentType = thumbRes.headers.get('content-type') || 'image/jpeg';
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200'
            }
          });
        }
      }
      return NextResponse.json({ error: 'Failed to fetch image from source' }, { status: response.status });
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200'
      }
    });
  } catch (error: any) {
    console.error('Media proxy error:', error);
    return NextResponse.json({ error: error.message || 'Media proxy error' }, { status: 500 });
  }
}
