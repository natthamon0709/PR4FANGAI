import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { uploadToStorage } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'ไม่พบไฟล์ที่อัปโหลด' }, { status: 400 });
    }

    const fileSizeKb = Math.round(file.size / 1024);
    if (fileSizeKb > 10240) {
      return NextResponse.json({ error: 'ขนาดไฟล์เกิน 10MB กรุณาเลือกไฟล์ที่เล็กลง' }, { status: 400 });
    }

    const fileName = file.name;
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    let fileType: 'pdf' | 'docx' | 'xlsx' | 'image' | 'other' = 'other';

    if (ext === 'pdf') fileType = 'pdf';
    else if (['doc', 'docx'].includes(ext)) fileType = 'docx';
    else if (['xls', 'xlsx', 'csv'].includes(ext)) fileType = 'xlsx';
    else if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) fileType = 'image';

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const contentType = file.type || 'application/octet-stream';

    // Upload to Supabase Storage bucket
    const uploadRes = await uploadToStorage(fileName, buffer, contentType, 'documents');
    let fileUrl = uploadRes.success && uploadRes.url ? uploadRes.url : '';

    // Local Disk Fallback if cloud storage is unavailable
    if (!fileUrl) {
      try {
        const fs = await import('fs');
        const path = await import('path');
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'documents');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        const safeLocalName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext ? '.' + ext : ''}`;
        const localPath = path.join(uploadDir, safeLocalName);
        fs.writeFileSync(localPath, buffer);
        fileUrl = `/uploads/documents/${safeLocalName}`;
      } catch (localErr) {
        console.error('Local fallback storage error:', localErr);
      }
    }

    if (!fileUrl) {
      return NextResponse.json({ error: 'ไม่สามารถบันทึกไฟล์ได้ กรุณาลองใหม่อีกครั้ง' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      attachment: {
        file_name: fileName,
        file_url: fileUrl,
        file_type: fileType,
        file_size_kb: fileSizeKb,
        uploaded_at: new Date().toISOString()
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'อัปโหลดไฟล์ไม่สำเร็จ: ' + error.message }, { status: 500 });
  }
}
