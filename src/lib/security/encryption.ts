/**
 * Server-side encryption for API keys.
 * Keys are encrypted before storing in DB, decrypted on use.
 * Uses AES-256-GCM with a derived key from ENCRYPTION_KEY env var.
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    // For development: derive a key from JWT_SECRET
    const fallback = process.env.JWT_SECRET;
    if (!fallback) {
      throw new Error('ENCRYPTION_KEY or JWT_SECRET must be set in .env');
    }
    return crypto.createHash('sha256').update(fallback).digest();
  }
  return Buffer.from(key.padEnd(32, '0').slice(0, 32));
}

/** Encrypt a plaintext string → base64 encoded string */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const tag = cipher.getAuthTag();

  // Format: iv:tag:encrypted (all base64)
  return `${iv.toString('base64')}:${tag.toString('base64')}:${encrypted}`;
}

/** Decrypt a base64 encoded string → plaintext */
export function decrypt(encoded: string): string {
  const key = getEncryptionKey();
  const [ivB64, tagB64, encrypted] = encoded.split(':');

  if (!ivB64 || !tagB64 || !encrypted) {
    throw new Error('Invalid encrypted data format');
  }

  const iv = Buffer.from(ivB64, 'base64');
  const tag = Buffer.from(tagB64, 'base64');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/** Check if a string appears to be encrypted */
export function isEncrypted(value: string): boolean {
  return value.includes(':') && value.split(':').length === 3;
}
