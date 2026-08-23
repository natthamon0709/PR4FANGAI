import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { pullLatestFromGoogleSheets } from '@/lib/google-sheets-sync';

interface RouteParams {
  params: { sheet_name: string };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    if (session.role !== 'administrator') {
      return NextResponse.json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สั่งซิงค์ได้' }, { status: 403 });
    }

    const sheetName = params.sheet_name;
    const syncResult = await pullLatestFromGoogleSheets(sheetName);

    return NextResponse.json({
      success: true,
      message: `ซิงค์ข้อมูลสดแท็บ ${sheetName} สำเร็จเรียบร้อยแล้ว`,
      synced_at: syncResult.synced_at,
      results: syncResult.results
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
