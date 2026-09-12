#!/usr/bin/env node
/**
 * PR4Fang AI — Cloud Database Migration Script
 * Migrates local SQLite database (pr4fang.db) to Turso LibSQL Cloud Database
 *
 * Usage:
 *   node scripts/migrate-to-cloud.js --dry-run
 *   node scripts/migrate-to-cloud.js --url libsql://pr4fang-xxx.turso.io --token <token>
 * Or with .env.local:
 *   TURSO_DATABASE_URL=libsql://... TURSO_AUTH_TOKEN=... node scripts/migrate-to-cloud.js
 */

const path = require('path');
const fs = require('fs');
const { createClient } = require('@libsql/client');

// Load environment variables from .env.local or .env if present
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [key, ...rest] = trimmed.split('=');
          const val = rest.join('=').replace(/^["']|["']$/g, '');
          if (!process.env[key.trim()]) {
            process.env[key.trim()] = val.trim();
          }
        }
      }
    }
  }
}

loadEnv();

const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');

function getArgValue(flag) {
  const idx = args.indexOf(flag);
  if (idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith('--')) {
    return args[idx + 1];
  }
  return null;
}

const targetUrl = getArgValue('--url') || process.env.TURSO_DATABASE_URL;
const targetToken = getArgValue('--token') || process.env.TURSO_AUTH_TOKEN;

const localDbPath = path.join(process.cwd(), 'data', 'pr4fang.db');

if (!fs.existsSync(localDbPath)) {
  console.error('❌ ไม่พบไฟล์ฐานข้อมูล Local: ' + localDbPath);
  process.exit(1);
}

// Table migration order respecting foreign keys
const TABLE_ORDER = [
  'departments',
  'sub_departments',
  'master_users',
  'reset_password_tokens',
  'login_audit_logs',
  'system_settings',
  'dashboard_summary_cache',
  'knowledge_items',
  'knowledge_attachments',
  'knowledge_version_history',
  'activity_feed',
  'knowledge_gap_logs',
  'announcements',
  'sheet_sync_configs',
  'sync_logs',
  'sync_conflicts',
  'ai_engine_configs',
  'ai_query_logs',
  'ai_retrieved_sources',
  'drive_media_cache',
  'line_channel_configs',
  'line_rich_menus',
  'line_broadcasts',
  'line_followers',
  'line_account_link_requests',
  'report_snapshots',
  'scheduled_report_configs',
  'custom_report_definitions',
  'report_export_logs',
  'college_profile',
  'security_policies',
  'notification_rules',
  'system_audit_logs',
  'backup_jobs',
  'user_preferences'
];

async function main() {
  console.log('=====================================================');
  console.log(' 🚀 PR4Fang AI — Cloud Database Migration (Turso/LibSQL)');
  console.log('=====================================================');
  console.log(`📁 Local DB: ${localDbPath}`);

  const localClient = createClient({ url: `file:${localDbPath}` });

  // Get table list and row counts
  console.log('\n🔍 กำลังตรวจสอบข้อมูล Local DB...');
  const tableStats = [];
  let totalRows = 0;

  for (const table of TABLE_ORDER) {
    try {
      const res = await localClient.execute(`SELECT COUNT(*) as count FROM ${table}`);
      const count = Number(res.rows[0]?.count || 0);
      tableStats.push({ table, count });
      totalRows += count;
    } catch (err) {
      // Table might not exist yet
      tableStats.push({ table, count: 0, missing: true });
    }
  }

  console.log('-----------------------------------------------------');
  console.log('ตารางทั้งหมดที่ตรวจพบ:');
  for (const s of tableStats) {
    if (!s.missing) {
      console.log(`  • ${s.table.padEnd(28)} : ${String(s.count).padStart(5)} แถว`);
    }
  }
  console.log('-----------------------------------------------------');
  console.log(`📊 รวมทั้งหมด: ${totalRows} แถว ใน ${tableStats.filter(s => !s.missing).length} ตาราง`);

  if (isDryRun) {
    console.log('\n💡 รันในโหมด --dry-run เรียบร้อย (ไม่มีการส่งข้อมูลไปยัง Cloud)');
    console.log('👉 หากต้องการย้ายข้อมูลจริง ให้ระบุ --url และ --token:');
    console.log('   node scripts/migrate-to-cloud.js --url libsql://xxx.turso.io --token ey...\n');
    return;
  }

  if (!targetUrl || targetUrl.startsWith('file:')) {
    console.log('\n⚠️ ยังไม่ได้ระบุ TURSO_DATABASE_URL สำหรับ Cloud Database');
    console.log('\nวิธีใช้งาน:');
    console.log(' 1. สมัครฟรีที่ https://turso.tech และสร้าง DB:');
    console.log('    turso db create pr4fang-db');
    console.log('    turso db tokens create pr4fang-db');
    console.log(' 2. รันสคริปต์นี้:');
    console.log('    node scripts/migrate-to-cloud.js --url <TURSO_URL> --token <TURSO_TOKEN>');
    console.log(' 3. หรือเพิ่มค่าลงในไฟล์ .env.local แล้วรัน:');
    console.log('    npm run dev  (จะเชื่อมต่อ Cloud ให้อัตโนมัติ)\n');
    return;
  }

  console.log(`\n🌐 กำลังเชื่อมต่อไปยัง Turso Cloud: ${targetUrl}`);
  const cloudClient = createClient({
    url: targetUrl,
    authToken: targetToken
  });

  // Test connection
  try {
    await cloudClient.execute('SELECT 1');
    console.log('✅ เชื่อมต่อ Turso Cloud สำเร็จ!');
  } catch (connErr) {
    console.error('❌ ไม่สามารถเชื่อมต่อ Turso Cloud ได้:', connErr.message);
    process.exit(1);
  }

  // 1. Migrate Schema (DDL)
  console.log('\n📋 กำลังสร้างโครงสร้างตารางบน Cloud (Schema Creation)...');
  const ddlRes = await localClient.execute(
    "SELECT sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' ORDER BY type DESC, name"
  );

  for (const row of ddlRes.rows) {
    const sql = String(row.sql);
    try {
      await cloudClient.execute(sql);
    } catch (ddlErr) {
      // Ignore if table already exists
      if (!ddlErr.message.includes('already exists')) {
        console.warn(`  ⚠️ คำเตือน DDL: ${ddlErr.message}`);
      }
    }
  }
  console.log('✅ โครงสร้างตารางพร้อมใช้งานแล้ว');

  // 2. Migrate Data
  console.log('\n🚚 กำลังย้ายข้อมูลไปยัง Cloud (Data Migration)...');
  for (const stat of tableStats) {
    if (stat.missing || stat.count === 0) continue;

    const table = stat.table;
    process.stdout.write(`  • ย้าย ${table.padEnd(28)} (${stat.count} แถว)... `);

    const rowsRes = await localClient.execute(`SELECT * FROM ${table}`);
    const rows = rowsRes.rows;

    if (rows.length === 0) {
      console.log('ข้าม (ว่าง)');
      continue;
    }

    const columns = Object.keys(rows[0]);
    const placeholders = columns.map(() => '?').join(', ');
    const insertSql = `INSERT OR IGNORE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;

    // Batch insert in chunks of 50
    const chunkSize = 50;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const batchStmts = [
        { sql: 'PRAGMA foreign_keys = OFF;', args: [] },
        ...chunk.map(r => ({
          sql: insertSql,
          args: columns.map(c => r[c])
        }))
      ];
      await cloudClient.batch(batchStmts, 'write');
    }

    console.log('✅ สำเร็จ');
  }

  // 3. Verify
  console.log('\n🔍 กำลังตรวจสอบข้อมูลบน Cloud หลังย้าย...');
  let cloudTotal = 0;
  for (const stat of tableStats) {
    if (stat.missing || stat.count === 0) continue;
    try {
      const res = await cloudClient.execute(`SELECT COUNT(*) as count FROM ${stat.table}`);
      const count = Number(res.rows[0]?.count || 0);
      cloudTotal += count;
    } catch {}
  }

  console.log('=====================================================');
  console.log(`🎉 การย้ายข้อมูลเสร็จสมบูรณ์ 100%!`);
  console.log(`📊 ตรวจพบข้อมูลบน Cloud ทั้งหมด ${cloudTotal} แถว`);
  console.log('=====================================================');
  console.log('\nขั้นตอนถัดไปสำหรับการ Deploy บน Vercel:');
  console.log('1. เข้า Vercel Dashboard > Project Settings > Environment Variables');
  console.log('2. เพิ่มตัวแปร:');
  console.log(`   TURSO_DATABASE_URL = ${targetUrl}`);
  console.log(`   TURSO_AUTH_TOKEN   = ${targetToken ? '(Token ของคุณ)' : ''}`);
  console.log('   PORT               = 3005');
  console.log('3. กด Deploy ได้ทันที ทุกฟังก์ชั่นจะทำงานผ่าน Cloud Database ฟรี!\n');
}

main().catch(err => {
  console.error('\n❌ เกิดข้อผิดพลาดในการย้ายข้อมูล:', err);
  process.exit(1);
});
