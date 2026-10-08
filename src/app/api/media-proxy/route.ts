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
