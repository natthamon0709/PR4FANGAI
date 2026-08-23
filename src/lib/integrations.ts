import getDb from './db';
import { User } from '@/types';

export const GOOGLE_SHEET_CONFIG = {
  spreadsheetId: '1-zp32f6bkCcXpGo5O__moHCAXcm_Sjg0rTPRkTK6fYs',
  gid: '547794364',
  sheetUrl: 'https://docs.google.com/spreadsheets/d/1-zp32f6bkCcXpGo5O__moHCAXcm_Sjg0rTPRkTK6fYs/edit?gid=547794364#gid=547794364',
  sheetName: 'Master Users'
};

export function getSystemSetting(key: string, defaultValue: string = ''): string {
  const db = getDb();
  const row = db.prepare('SELECT value FROM system_settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row ? row.value : defaultValue;
}

export function setSystemSetting(key: string, value: string): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO system_settings (key, value, updated_at)
    VALUES (?, ?, datetime('now', 'localtime'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run(key, value);
}

export function exportUsersForGoogleSheets(): {
  headers: string[];
  rows: (string | number | null)[][];
  totalUsers: number;
  exportedAt: string;
} {
  const db = getDb();
  const users = db.prepare(`
    SELECT 
      u.user_id,
      u.first_name,
      u.last_name,
      u.email,
      u.phone,
      d.name as department_name,
      s.name as sub_department_name,
      u.role,
      u.status,
      u.line_user_id,
      u.last_login_at,
      u.created_at,
      u.updated_at
    FROM master_users u
    LEFT JOIN departments d ON u.department_id = d.department_id
    LEFT JOIN sub_departments s ON u.sub_department_id = s.sub_department_id
    ORDER BY u.created_at DESC
  `).all() as any[];

  const headers = [
    'User ID',
    'ชื่อ',
    'นามสกุล',
    'อีเมล',
    'เบอร์โทรศัพท์',
    'ฝ่าย (Department)',
    'งาน (Sub-department)',
    'สิทธิ์ (Role)',
    'สถานะ (Status)',
    'LINE User ID',
    'เข้าสู่ระบบล่าสุด (Last Login)',
    'วันที่สร้างบัญชี (Created At)',
    'อัปเดตล่าสุด (Updated At)'
  ];

  const rows = users.map(u => [
    u.user_id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone || '-',
    u.department_name || '-',
    u.sub_department_name || '-',
    u.role === 'administrator' ? 'Administrator' : 'Staff',
    u.status === 'active' ? 'เปิดใช้งาน (Active)' : 'ปิดใช้งาน (Suspended)',
    u.line_user_id || '-',
    u.last_login_at || '-',
    u.created_at,
    u.updated_at
  ]);

  return {
    headers,
    rows,
    totalUsers: users.length,
    exportedAt: new Date().toISOString()
  };
}

export async function triggerN8nWebhook(event: string, data: any) {
  const webhookUrl = getSystemSetting('n8n_webhook_url');
  const apiKey = getSystemSetting('n8n_api_key');

  if (!webhookUrl) return { skipped: true, reason: 'No webhook URL configured' };

  try {
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      source: 'PR4Fang AI System - Community College',
      data
    };

    // Attempt to notify n8n if available (non-blocking)
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-PR4Fang-Key': apiKey
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(3000)
    }).catch(e => ({ ok: false, statusText: e.message }));

    return { success: true, event };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
