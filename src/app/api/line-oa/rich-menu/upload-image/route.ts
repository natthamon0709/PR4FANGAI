import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

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

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'richmenu');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const fileName = `richmenu-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext === 'webp' ? 'png' : ext}`;
    const filePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(filePath, buffer);

    // Auto-fit dimensions to exact 2500x1686 and compress to <1MB
    try {
      const { execSync } = await import('child_process');
      execSync(`sips -z 1686 2500 "${filePath}" --setProperty formatOptions 85`);
    } catch (resizeErr) {
      console.warn('sips resize warning:', resizeErr);
    }

    const publicUrl = `/uploads/richmenu/${fileName}`;

    return NextResponse.json({
      success: true,
      imageUrl: publicUrl,
      fileName
    });
  } catch (error: any) {
    console.error('Rich Menu image upload error:', error);
    return NextResponse.json({ error: 'อัปโหลดรูปภาพไม่สำเร็จ: ' + error.message }, { status: 500 });
  }
}
