import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    // In a production server, files can be written to disk / S3.
    // For our serverless App Router setup, we parse the formData and generate secure file metadata.
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

    const mockFileUrl = `https://drive.google.com/file/d/sample_${Date.now()}/view?usp=sharing`;

    return NextResponse.json({
      success: true,
      attachment: {
        file_name: fileName,
        file_url: mockFileUrl,
        file_type: fileType,
        file_size_kb: fileSizeKb,
        uploaded_at: new Date().toISOString()
      }
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'อัปโหลดไฟล์ไม่สำเร็จ: ' + error.message }, { status: 500 });
  }
}
