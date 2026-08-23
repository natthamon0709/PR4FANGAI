import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { exportUsersForGoogleSheets, GOOGLE_SHEET_CONFIG, getSystemSetting } from '@/lib/integrations';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    // Allow admin or requests with API key in header
    const apiKey = req.headers.get('x-api-key') || req.headers.get('x-pr4fang-key');
    const configuredKey = getSystemSetting('n8n_api_key', 'fang_ai_n8n_live_sec_key_2026');
    const isApiKeyValid = Boolean(apiKey && apiKey === configuredKey);

    if ((!session || session.role !== 'administrator') && !isApiKeyValid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const exportData = exportUsersForGoogleSheets();

    return NextResponse.json({
      googleSheet: GOOGLE_SHEET_CONFIG,
      ...exportData
    });
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
