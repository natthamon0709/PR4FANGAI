const Database = require('better-sqlite3');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const fs = require('fs');

try {
  const { loadEnvConfig } = require('@next/env');
  loadEnvConfig(path.join(__dirname, '..'));
} catch (e) {
  // @next/env not found or already loaded
}

const dbPath = path.join(__dirname, '..', 'data', 'pr4fang.db');
if (!fs.existsSync(dbPath)) {
  console.error('❌ SQLite database file not found at:', dbPath);
  process.exit(1);
}

const sqlite = new Database(dbPath);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

console.log('🚀 Starting Full Data Migration from SQLite -> Supabase Cloud...\n');

async function migrateTable(tableName, primaryKey = null, transformFn = null) {
  try {
    const rows = sqlite.prepare(`SELECT * FROM ${tableName}`).all();
    if (rows.length === 0) {
      console.log(`  ⚪ [${tableName}] No rows found in SQLite.`);
      return;
    }

    const transformedRows = transformFn ? rows.map(transformFn) : rows;

    // Batch upsert in chunks of 50
    const chunkSize = 50;
    let inserted = 0;

    for (let i = 0; i < transformedRows.length; i += chunkSize) {
      const chunk = transformedRows.slice(i, i + chunkSize);
      const { error } = await supabase.from(tableName).upsert(chunk, {
        onConflict: primaryKey || undefined
      });

      if (error) {
        console.error(`  ❌ [${tableName}] Chunk ${i}-${i + chunk.length} Error:`, error.message);
      } else {
        inserted += chunk.length;
      }
    }

    console.log(`  ✅ [${tableName}] Migrated ${inserted}/${rows.length} rows successfully.`);
  } catch (err) {
    console.error(`  ❌ [${tableName}] Fatal error:`, err.message);
  }
}

async function run() {
  console.log('1. Migrating Core Organization & System...');
  await migrateTable('departments', 'department_id');
  await migrateTable('sub_departments', 'sub_department_id');
  await migrateTable('master_users', 'user_id');
  await migrateTable('system_settings', 'key');
  await migrateTable('college_profile', 'profile_id');
  await migrateTable('security_policies', 'policy_id');
  await migrateTable('notification_rules', 'rule_id');
  await migrateTable('user_preferences', 'user_id');

  console.log('\n2. Migrating Configs...');
  await migrateTable('ai_engine_configs', 'config_id');
  await migrateTable('line_channel_configs', 'config_id');
  await migrateTable('line_rich_menus', 'menu_id');
  await migrateTable('sheet_sync_configs', 'config_id');
  await migrateTable('scheduled_report_configs', 'config_id');

  console.log('\n3. Migrating Knowledge Management...');
  await migrateTable('knowledge_items', 'knowledge_id', row => ({
    ...row,
    tags: typeof row.tags === 'string' ? row.tags : JSON.stringify(row.tags || [])
  }));
  await migrateTable('knowledge_version_history', 'version_id');
  await migrateTable('knowledge_attachments', 'attachment_id');

  console.log('\n4. Migrating Feed, Announcements & Gaps...');
  await migrateTable('activity_feed', 'activity_id');
  await migrateTable('announcements', 'announcement_id');
  await migrateTable('knowledge_gap_logs', 'gap_id');

  console.log('\n5. Migrating Drive Media & Analytics...');
  await migrateTable('drive_media_cache', 'media_id');
  await migrateTable('report_snapshots', 'snapshot_id');
  await migrateTable('report_export_logs', 'log_id');
  await migrateTable('system_audit_logs', 'log_id');
  await migrateTable('login_audit_logs', 'log_id');
  await migrateTable('backup_jobs', 'backup_id');

  console.log('\n🎉 ALL DATA MIGRATION COMPLETE! Everything from SQLite is now on Supabase Cloud!\n');
}

run().catch(console.error);
