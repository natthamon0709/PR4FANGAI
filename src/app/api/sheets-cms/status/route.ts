import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import getDb from '@/lib/db';
import { SheetSyncConfig, SyncStatus } from '@/types/sheets';

const SHEET_TITLES_TH: Record<string, string> = {
  Master_Users: 'ข้อมูลผู้ใช้งาน (Master Users)',
  Knowledge_Base: 'คลังองค์ความรู้เอกภาพ (Knowledge Base)',
  Master_Department: 'ฝ่ายงานหลัก 4 ฝ่าย (Master Department)',
  Master_Section: 'งานและแผนกย่อย 23 งาน (Master Section)',
  Drive_Media: 'คลังสื่อรูปภาพและบุคลากร (Drive Media)',
  Knowledge_Gaps: 'บันทึกคำถามที่ยังไม่มีคำตอบ (Knowledge Gaps)',
  AI_Query_Logs: 'ประวัติการสืบค้น AI (AI Query Logs)',
  LINE_Configs: 'การตั้งค่าช่องทาง LINE (LINE Configs)',
  master_users: 'ข้อมูลผู้ใช้งาน (Master Users)',
  knowledge: 'คลังองค์ความรู้เอกภาพ (Knowledge Base)',
  departments: 'ฝ่ายงานหลัก (Departments)',
  sub_departments: 'งานและแผนกย่อย (Sub Departments)',
};

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 });
    }

    const db = getDb();
    const isAdmin = session.role === 'administrator';

    // Fetch Connection Settings
    const settingsRows = db.prepare('SELECT key, value FROM system_settings').all() as { key: string; value: string }[];

    const settings: Record<string, string> = {};
    settingsRows.forEach(r => { settings[r.key] = r.value; });

    // Fetch 7 Sheet Configs
    const configs = db.prepare('SELECT * FROM sheet_sync_configs ORDER BY config_id ASC').all() as any[];

    // Calculate row counts & statuses for each sheet
    const formattedConfigs: SheetSyncConfig[] = configs.map((cfg) => {
      let mapping = {};
      try { mapping = JSON.parse(cfg.field_mapping || '{}'); } catch (e) {}

      let totalRows = 0;
      let pendingCount = 0;
      let errorCount = 0;
      let conflictCount = 0;

      const normalized = cfg.sheet_name.toLowerCase();

      if (normalized === 'master_users') {
        totalRows = (db.prepare('SELECT COUNT(*) as c FROM master_users').get() as any).c;
      } else if (normalized === 'knowledge_base' || normalized === 'knowledge') {
        totalRows = (db.prepare('SELECT COUNT(*) as c FROM knowledge_items').get() as any).c;
        pendingCount = (db.prepare("SELECT COUNT(*) as c FROM knowledge_items WHERE sync_status = 'pending'").get() as any).c;
      } else if (normalized === 'master_department' || normalized === 'departments') {
        totalRows = (db.prepare('SELECT COUNT(*) as c FROM departments').get() as any).c;
      } else if (normalized === 'master_section' || normalized === 'sub_departments') {
        totalRows = (db.prepare('SELECT COUNT(*) as c FROM sub_departments').get() as any).c;
      } else if (normalized === 'drive_media') {
        totalRows = (db.prepare('SELECT COUNT(*) as c FROM drive_media_cache').get() as any).c;
      } else if (normalized === 'knowledge_gaps') {
        totalRows = (db.prepare('SELECT COUNT(*) as c FROM knowledge_gap_logs').get() as any).c;
      } else if (normalized === 'ai_query_logs') {
        totalRows = (db.prepare('SELECT COUNT(*) as c FROM ai_query_logs').get() as any).c;
      } else if (normalized === 'line_configs') {
        totalRows = (db.prepare('SELECT COUNT(*) as c FROM line_channel_configs').get() as any).c;
      }

      // Check conflicts count for this sheet
      conflictCount = (db.prepare("SELECT COUNT(*) as c FROM sync_conflicts WHERE (sheet_name = ? OR LOWER(sheet_name) = ?) AND status = 'unresolved'").get(cfg.sheet_name, normalized) as any).c;

      let status: SyncStatus = 'success';
      if (errorCount > 0) status = 'error';
      else if (conflictCount > 0) status = 'conflict';
      else if (pendingCount > 0) status = 'pending';

      return {
        ...cfg,
        sheet_title_th: SHEET_TITLES_TH[cfg.sheet_name] || cfg.sheet_name,
        field_mapping: mapping,
        is_active: Boolean(cfg.is_active),
        total_rows: totalRows,
        pending_count: pendingCount,
        error_count: errorCount,
        conflict_count: conflictCount,
        status,
      };
    });

    // Total Unresolved Conflicts across all sheets
    const totalConflicts = (db.prepare("SELECT COUNT(*) as c FROM sync_conflicts WHERE status = 'unresolved'").get() as any).c;
    const unresolvedConflicts = db.prepare(`
      SELECT * FROM sync_conflicts WHERE status = 'unresolved' ORDER BY created_at DESC
    `).all().map((c: any) => ({
      ...c,
      db_value: JSON.parse(c.db_value || '{}'),
      sheet_value: JSON.parse(c.sheet_value || '{}')
    }));

    return NextResponse.json({
      connected: true,
      google_account_email: settings.google_account_email || 'pr4fang-service-account@fang-ai-2026.iam.gserviceaccount.com',
      spreadsheet_id: settings.google_sheets_id || '1-zp32f6bkCcXpGo5O__moHCAXcm_Sjg0rTPRkTK6fYs',
      google_apps_script_url: settings.google_apps_script_url || '',
      last_synced_at: settings.google_sheets_last_synced || new Date().toISOString(),
      configs: formattedConfigs,
      total_conflicts: totalConflicts,
      conflicts: unresolvedConflicts,
      is_admin: isAdmin,
    });
  } catch (error: any) {
    console.error('Sheets status error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'administrator') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { google_apps_script_url, spreadsheet_id } = body;

    const db = getDb();
    if (google_apps_script_url !== undefined) {
      db.prepare(`
        INSERT INTO system_settings (key, value, updated_at) 
        VALUES ('google_apps_script_url', ?, datetime('now', 'localtime')) 
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).run(google_apps_script_url.trim());
    }

    if (spreadsheet_id !== undefined) {
      db.prepare(`
        INSERT INTO system_settings (key, value, updated_at) 
        VALUES ('google_sheets_id', ?, datetime('now', 'localtime')) 
        ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
      `).run(spreadsheet_id.trim());
    }

    return NextResponse.json({ 
      success: true, 
      message: 'บันทึกการตั้งค่า Google Apps Script เรียบร้อยแล้ว' 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
