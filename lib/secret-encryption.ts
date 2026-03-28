import crypto from 'crypto';

const deriveKey = () => {
  const raw = process.env.SECRET_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY;
  if (!raw || raw.length < 32) {
    throw new Error('SECRET_ENCRYPTION_KEY (or ENCRYPTION_KEY) with at least 32 chars is required.');
  }
  return crypto.createHash('sha256').update(raw).digest();
};

const VERSION_PREFIX = 'enc:v1:';

export const encryptSecret = (plaintext: string) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', deriveKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${VERSION_PREFIX}${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
};

export const decryptSecret = (value: string) => {
  if (!value.startsWith(VERSION_PREFIX)) {
    return value;
  }
  const payload = value.slice(VERSION_PREFIX.length);
  const [ivRaw, tagRaw, cipherRaw] = payload.split('.');
  if (!ivRaw || !tagRaw || !cipherRaw) throw new Error('Invalid encrypted secret format.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', deriveKey(), Buffer.from(ivRaw, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(cipherRaw, 'base64url')), decipher.final()]);
  return decrypted.toString('utf8');
};

export const isEncryptedSecret = (value: string | null | undefined) => typeof value === 'string' && value.startsWith(VERSION_PREFIX);
