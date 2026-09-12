const path = require('path');
const { createClient } = require('@supabase/supabase-js');

try {
  const { loadEnvConfig } = require('@next/env');
  loadEnvConfig(path.join(__dirname, '..'));
} catch (e) {
  // @next/env not found or already loaded
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !serviceKey || !publishableKey) {
  console.error('❌ Missing Supabase credentials in environment variables (.env.local).');
  process.exit(1);
}

console.log('🧪 PR4Fang AI — Supabase Integration Verification Test\n');

const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false }
});

const supabasePublic = createClient(supabaseUrl, publishableKey, {
  auth: { persistSession: false }
});

async function runTests() {
  let passed = 0;
  let total = 0;

  function assert(condition, name) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name}`);
    }
  }

  // 1. Supabase URL and keys check
  assert(supabaseUrl.startsWith('https://'), 'Supabase URL is valid HTTPS endpoint');
  assert(serviceKey.length > 20, 'Supabase Secret / Service Role Key is configured');
  assert(publishableKey.length > 20, 'Supabase Publishable / Anon Key is configured');

  // 2. Test PostgREST API connection
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': serviceKey,
        'Authorization': `Bearer ${serviceKey}`
      }
    });
    assert(res.status === 200, `Supabase PostgREST responds with HTTP 200 (Status: ${res.status})`);
  } catch (err) {
    assert(false, `Supabase PostgREST connection error: ${err.message}`);
  }

  // 3. Test Storage Buckets API
  try {
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
    assert(!error, `Supabase Storage API accessible (Buckets found: ${buckets ? buckets.length : 0})`);
  } catch (err) {
    assert(false, `Supabase Storage error: ${err.message}`);
  }

  // 4. Test Table Status
  try {
    const { data, error } = await supabaseAdmin.from('departments').select('*').limit(1);
    if (!error) {
      console.log('  ℹ️  [INFO] "departments" table is already created on Supabase!');
    } else if (error.code === 'PGRST205') {
      console.log('  ℹ️  [INFO] Tables pending creation via Supabase SQL Editor (Run supabase/schema.sql & seed.sql)');
    }
  } catch {}

  console.log(`\n📊 Verification Summary: ${passed}/${total} checks passed.\n`);
}

runTests();
