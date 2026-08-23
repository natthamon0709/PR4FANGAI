import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';
import { getLineChannelConfig, testLineConnectionLive, getRawLineChannelAccessToken } from '@/lib/line-service';
import { encryptApiKey, decryptApiKey } from '@/lib/ai-crypto';
import { pushToGoogleSheets, pullLatestFromGoogleSheets } from '@/lib/google-sheets-sync';
import { getSystemSetting, setSystemSetting } from '@/lib/integrations';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    if (session.role !== 'administrator') {
      return NextResponse.json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้น' }, { status: 403 });
    }

    const config = getLineChannelConfig();
    const appsScriptUrl = getSystemSetting('google_apps_script_url', '');

    return NextResponse.json({
      config,
      google_apps_script_url: appsScriptUrl,
      is_admin: true
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Test Connection endpoint or Pull from Google Sheet
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้น' }, { status: 403 });
    }

    const body = await req.json();

    // Check if user requested a Pull from Google Sheets
    if (body.action === 'pull_from_sheet') {
      const syncRes = await pullLatestFromGoogleSheets('LINE_Configs');
      const lineRes = syncRes.results['LINE_Configs'];
      
      if (lineRes && lineRes.status === 'error') {
        return NextResponse.json({
          success: false,
          error: `ไม่สามารถดึงข้อมูลจาก Google Sheet ได้: ${lineRes.error || 'โปรดตรวจสอบว่ามีแท็บ LINE_Configs ใน Google Sheet หรือยัง'}`
        }, { status: 400 });
      }

      const updatedConfig = getLineChannelConfig();
      return NextResponse.json({
        success: true,
        message: 'ดึงข้อมูลการตั้งค่า LINE Channel จากแท็บ LINE_Configs ใน Google Sheet สำเร็จแล้ว',
        config: updatedConfig
      });
    }

    let tokenToTest = body.channel_access_token?.trim();

    if (!tokenToTest || tokenToTest.includes('••••')) {
      tokenToTest = getRawLineChannelAccessToken() || '';
    }

    if (!tokenToTest) {
      return NextResponse.json({ error: 'กรุณากรอก Channel Access Token เพื่อทดสอบ' }, { status: 400 });
    }

    const testRes = await testLineConnectionLive(tokenToTest);

    const db = getDb();
    if (!testRes.success) {
      // If live test fails, update status to disconnected in DB
      db.prepare(`
        UPDATE line_channel_configs
        SET webhook_verified = 0,
            bot_display_name = NULL,
            bot_basic_id = NULL,
            bot_picture_url = NULL,
            updated_at = datetime('now', 'localtime')
        WHERE is_active = 1
      `).run();

      return NextResponse.json({
        success: false,
        error: testRes.error || 'ไม่สามารถเชื่อมต่อ LINE API ได้'
      }, { status: 400 });
    }

    // Update verified status in DB if this token matches
    db.prepare(`
      UPDATE line_channel_configs
      SET webhook_verified = 1,
          bot_display_name = ?,
          bot_basic_id = ?,
          bot_picture_url = ?,
          updated_at = datetime('now', 'localtime')
      WHERE is_active = 1
    `).run(
      testRes.botInfo?.displayName || null,
      testRes.botInfo?.basicId || null,
      testRes.botInfo?.pictureUrl || null
    );

    return NextResponse.json({
      success: true,
      message: `เชื่อมต่อกับ LINE Official Account "${testRes.botInfo?.displayName}" (@${testRes.botInfo?.basicId}) สำเร็จ!`,
      botInfo: testRes.botInfo
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * Save / Update Channel Settings
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้น' }, { status: 403 });
    }

    const body = await req.json();
    const { channel_id, channel_secret, channel_access_token, webhook_url, google_apps_script_url } = body;

    if (google_apps_script_url !== undefined) {
      setSystemSetting('google_apps_script_url', google_apps_script_url.trim());
    }

    const db = getDb();
    const current = db.prepare('SELECT * FROM line_channel_configs WHERE is_active = 1 LIMIT 1').get() as any;

    let finalSecretEnc = '';
    if (channel_secret !== undefined) {
      if (channel_secret.includes('••••')) {
        finalSecretEnc = current?.channel_secret_encrypted || '';
      } else if (channel_secret.trim() !== '') {
        finalSecretEnc = encryptApiKey(channel_secret.trim());
      } else {
        finalSecretEnc = '';
      }
    } else {
      finalSecretEnc = current?.channel_secret_encrypted || '';
    }

    let finalTokenEnc = '';
    let rawToken = '';
    if (channel_access_token !== undefined) {
      if (channel_access_token.includes('••••')) {
        // Keeping existing token
        finalTokenEnc = current?.channel_access_token_encrypted || '';
        rawToken = current?.channel_access_token_encrypted ? decryptApiKey(current.channel_access_token_encrypted) || '' : '';
      } else if (channel_access_token.trim() !== '') {
        // User entered a new token
        rawToken = channel_access_token.trim();
        finalTokenEnc = encryptApiKey(rawToken);
      } else {
        // User explicitly cleared/deleted the token
        finalTokenEnc = '';
        rawToken = '';
      }
    } else {
      finalTokenEnc = current?.channel_access_token_encrypted || '';
      rawToken = current?.channel_access_token_encrypted ? decryptApiKey(current.channel_access_token_encrypted) || '' : '';
    }

    const finalWebhookUrl = webhook_url?.trim() || 'http://localhost:3000/api/line-oa/webhook';
    const finalChannelId = channel_id?.trim() || '';

    // Perform REAL live validation against LINE Messaging API
    let isVerified = 0;
    let botDisplayName: string | null = null;
    let botBasicId: string | null = null;
    let botPictureUrl: string | null = null;
    let validationError = '';

    if (rawToken) {
      const testRes = await testLineConnectionLive(rawToken);
      if (testRes.success) {
        isVerified = 1;
        botDisplayName = testRes.botInfo?.displayName || null;
        botBasicId = testRes.botInfo?.basicId || null;
        botPictureUrl = testRes.botInfo?.pictureUrl || null;
      } else {
        isVerified = 0;
        validationError = testRes.error || 'การตรวจสอบ Token ล้มเหลว';
      }
    } else {
      // No token provided -> clear verified status & bot info
      isVerified = 0;
    }

    if (current) {
      db.prepare(`
        UPDATE line_channel_configs
        SET channel_id = ?, channel_secret_encrypted = ?, channel_access_token_encrypted = ?,
            webhook_url = ?, webhook_verified = ?, bot_display_name = ?, bot_basic_id = ?, bot_picture_url = ?,
            updated_at = datetime('now', 'localtime')
        WHERE config_id = ?
      `).run(finalChannelId, finalSecretEnc, finalTokenEnc, finalWebhookUrl, isVerified, botDisplayName, botBasicId, botPictureUrl, current.config_id);
    } else {
      db.prepare(`
        INSERT INTO line_channel_configs (
          config_id, channel_id, channel_secret_encrypted, channel_access_token_encrypted,
          webhook_url, webhook_verified, is_active, bot_display_name, bot_basic_id, bot_picture_url, updated_at
        ) VALUES ('line-cfg-001', ?, ?, ?, ?, ?, 1, ?, ?, ?, datetime('now', 'localtime'))
      `).run(finalChannelId, finalSecretEnc, finalTokenEnc, finalWebhookUrl, isVerified, botDisplayName, botBasicId, botPictureUrl);
    }

    // Push sync to Google Sheets (LINE_Configs tab)
    try {
      await pushToGoogleSheets('LINE_Configs', 'update', {
        config_id: 'line-cfg-001',
        channel_id: finalChannelId,
        channel_secret_encrypted: finalSecretEnc,
        channel_access_token_encrypted: finalTokenEnc,
        webhook_url: finalWebhookUrl,
        webhook_verified: isVerified,
        bot_display_name: botDisplayName,
        bot_basic_id: botBasicId
      });
    } catch (pushErr) {
      console.log('Push to Google Sheets skipped:', pushErr);
    }

    if (rawToken && isVerified === 0) {
      return NextResponse.json({
        success: false,
        warning: true,
        message: `บันทึกข้อมูลแล้ว แต่ทดสอบการเชื่อมต่อกับ LINE API ไม่ผ่าน: ${validationError} (สถานะ: ยังไม่ได้เชื่อมต่อ)`
      }, { status: 200 });
    }

    if (!rawToken) {
      return NextResponse.json({
        success: true,
        message: 'บันทึกการตั้งค่าแล้ว (สถานะ: ยังไม่ได้ระบุ Token หรือยกเลิกการเชื่อมต่อ)'
      });
    }

    return NextResponse.json({
      success: true,
      message: `บันทึกการตั้งค่าและเชื่อมต่อกับ LINE Official Account "${botDisplayName || ''}" (@${botBasicId || ''}) สำเร็จ!`
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/line-oa/settings: Reset/Clear LINE Channel credentials
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้น' }, { status: 403 });
    }

    const db = getDb();
    db.prepare(`
      UPDATE line_channel_configs
      SET channel_id = '',
          channel_secret_encrypted = '',
          channel_access_token_encrypted = '',
          webhook_verified = 0,
          bot_display_name = NULL,
          bot_basic_id = NULL,
          bot_picture_url = NULL,
          updated_at = datetime('now', 'localtime')
      WHERE is_active = 1
    `).run();

    try {
      await pushToGoogleSheets('LINE_Configs', 'update', {
        config_id: 'line-cfg-001',
        channel_id: '',
        channel_secret_encrypted: '',
        channel_access_token_encrypted: '',
        webhook_url: 'http://localhost:3000/api/line-oa/webhook',
        webhook_verified: 0,
        bot_display_name: '',
        bot_basic_id: ''
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'ล้างข้อมูลการเชื่อมต่อ LINE Channel เรียบร้อยแล้ว (สถานะ: ยังไม่ได้เชื่อมต่อ)'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
