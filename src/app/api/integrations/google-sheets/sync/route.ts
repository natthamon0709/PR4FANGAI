import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { exportUsersForGoogleSheets, GOOGLE_SHEET_CONFIG, setSystemSetting, getSystemSetting, triggerN8nWebhook } from '@/lib/integrations';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    const apiKey = req.headers.get('x-api-key') || req.headers.get('x-pr4fang-key');
    const configuredKey = getSystemSetting('n8n_api_key', 'fang_ai_n8n_live_sec_key_2026');
    const isApiKeyValid = Boolean(apiKey && apiKey === configuredKey);

    if ((!session || session.role !== 'administrator') && !isApiKeyValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = exportUsersForGoogleSheets();
    const now = new Date().toISOString();

    setSystemSetting('google_sheets_last_synced', now);
    setSystemSetting('google_sheets_sync_status', 'synced');

    // Execute Live Two-Way Pull Sync
    const { pullLatestFromGoogleSheets } = await import('@/lib/google-sheets-sync');
    const syncResult = await pullLatestFromGoogleSheets();

    // Trigger webhook to n8n workflow for automated Google Sheets live sync
    await triggerN8nWebhook('sheets.sync_requested', {
      sheetId: GOOGLE_SHEET_CONFIG.spreadsheetId,
      gid: GOOGLE_SHEET_CONFIG.gid,
      data
    });

    return NextResponse.json({
      success: true,
      message: 'ซิงค์ข้อมูลสดสองทางกับ Google Sheets เรียบร้อยแล้ว (Two-way Live Sync Complete)',
      syncedAt: now,
      spreadsheetId: GOOGLE_SHEET_CONFIG.spreadsheetId,
      gid: GOOGLE_SHEET_CONFIG.gid,
      sheetUrl: GOOGLE_SHEET_CONFIG.sheetUrl,
      recordsCount: data.totalUsers,
      results: syncResult.results
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'ซิงค์ข้อมูลล้มเหลว: ' + error.message }, { status: 500 });
  }
}
