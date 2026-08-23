import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { pullLatestFromGoogleSheets } from '@/lib/google-sheets-sync';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    if (session.role !== 'administrator') {
      return NextResponse.json({ error: 'เฉพาะผู้ดูแลระบบ (Administrator) เท่านั้นที่สั่งซิงค์ทั้งหมดได้' }, { status: 403 });
    }

    const syncResult = await pullLatestFromGoogleSheets();

    return NextResponse.json({
      success: true,
      message: 'ซิงค์ข้อมูลสดทั้ง 4 แท็บกับ Google Sheets สำเร็จเรียบร้อยแล้ว (Two-way Sync Complete)',
      synced_at: syncResult.synced_at,
      results: syncResult.results
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'การซิงค์ล้มเหลว: ' + error.message }, { status: 500 });
  }
}
