import crypto from 'crypto';

const ENCRYPTION_SECRET = process.env.AI_SECRET_KEY || 'pr4fang_ai_secure_master_key_2026_aes256';
const ALGORITHM = 'aes-256-cbc';
const KEY = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();

export function encryptApiKey(apiKey: string): string {
  if (!apiKey || apiKey.startsWith('enc_')) return apiKey;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(apiKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `enc_${iv.toString('hex')}:${encrypted}`;
}

export function decryptApiKey(encryptedText: string): string {
  if (!encryptedText) return '';
  if (!encryptedText.startsWith('enc_')) return encryptedText;

  try {
    const raw = encryptedText.replace('enc_', '');
    const [ivHex, encryptedHex] = raw.split(':');
    if (!ivHex || !encryptedHex) return encryptedText;

    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('Failed to decrypt API key, returning fallback:', err);
    return '';
  }
}

export function maskApiKey(apiKeyOrEncrypted: string): string {
  if (!apiKeyOrEncrypted) return '••••••••••••••••';
  const decrypted = decryptApiKey(apiKeyOrEncrypted);
  if (decrypted.length <= 4) return '••••••••' + decrypted;
  const last4 = decrypted.slice(-4);
  return '••••••••••••••••' + last4;
}
