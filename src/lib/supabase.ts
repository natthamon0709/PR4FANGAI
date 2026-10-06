import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || 'placeholder-anon-key';
const supabaseSecretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || 'placeholder-secret-key';

import crypto from 'crypto';

// Standard client (Public / Browser / SSR)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

// Admin client (Server API Routes / High privilege / Service Role)
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || '';
  return Boolean(
    url &&
    !url.includes('placeholder') &&
    key &&
    !key.includes('placeholder')
  );
}

export function getSupabaseAdmin(): SupabaseClient {
  return supabaseAdmin;
}

export function getSupabaseClient(): SupabaseClient {
  return supabase;
}

// -------------------------------------------------------------------------
// Storage Utilities (pr4fang-media bucket)
// -------------------------------------------------------------------------
export const STORAGE_BUCKET = 'pr4fang-media';

/**
 * Upload a file/buffer to Supabase Storage
 */
export async function uploadToStorage(
  fileName: string,
  fileBody: Buffer | Blob | Uint8Array,
  contentType: string,
  folder: string = 'documents'
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const ext = fileName.includes('.') ? '.' + fileName.split('.').pop()!.toLowerCase() : '';
    const randomSuffix = crypto.randomUUID().slice(0, 8);
    // Use safe ASCII path for S3 storage key to prevent InvalidKey error with Thai characters
    const filePath = `${folder}/${Date.now()}-${randomSuffix}${ext}`;
    const { data, error } = await supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, fileBody, {
        contentType,
        upsert: true
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return { success: false, error: error.message };
    }

    const { data: publicData } = supabaseAdmin.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);

    return {
      success: true,
      url: publicData.publicUrl
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
