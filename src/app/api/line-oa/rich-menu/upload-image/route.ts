import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { uploadToStorage } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้น' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'กรุณาเลือกไฟล์รูปภาพ' }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'ขนาดรูปภาพต้องไม่เกิน 5MB' }, { status: 400 });
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      return NextResponse.json({ error: 'รองรับเฉพาะไฟล์รูปภาพนามสกุล .jpg, .png, .webp' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const contentType = file.type || 'image/jpeg';

    // Upload to Supabase Storage 'pr4fang-media' under 'richmenu' folder
    const uploadRes = await uploadToStorage(file.name, buffer, contentType, 'richmenu');

    if (!uploadRes.success || !uploadRes.url) {
      return NextResponse.json({ error: uploadRes.error || 'อัปโหลดรูปลง Supabase Storage ไม่สำเร็จ' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      imageUrl: uploadRes.url,
      fileName: file.name
    });
  } catch (error: any) {
    console.error('Rich menu image upload error:', error);
    return NextResponse.json({ error: 'อัปโหลดรูปภาพไม่สำเร็จ: ' + error.message }, { status: 500 });
  }
}
