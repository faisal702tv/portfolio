import { describe, it, expect } from 'vitest';

process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long';

import { encrypt, decrypt, isEncrypted } from '../encryption';

describe('Encryption', () => {
  it('should encrypt and decrypt a string', () => {
    const original = 'sk-openai-my-secret-key-12345';
    const encrypted = encrypt(original);
    
    expect(encrypted).not.toBe(original);
    expect(isEncrypted(encrypted)).toBe(true);
    
    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(original);
  });

  it('should produce different ciphertexts for same input', () => {
    const input = 'same-input';
    const encrypted1 = encrypt(input);
    const encrypted2 = encrypt(input);
    
    // Different IVs means different ciphertexts
    expect(encrypted1).not.toBe(encrypted2);
    
    // But both decrypt to same value
    expect(decrypt(encrypted1)).toBe(input);
    expect(decrypt(encrypted2)).toBe(input);
  });

  it('should handle various API key formats', () => {
    const keys = [
      'sk-proj-abc123DEF456ghi789JKL012mno345',
      'ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      'AIzaSyA1234567890abcdefghijklmnopqrstuvwx',
      'xai-1234567890abcdefghijklmnopqrstuvwx',
    ];

    for (const key of keys) {
      const encrypted = encrypt(key);
      expect(decrypt(encrypted)).toBe(key);
    }
  });

  it('should reject invalid encrypted data', () => {
    expect(() => decrypt('invalid')).toThrow();
    expect(() => decrypt('')).toThrow();
  });

  it('should identify non-encrypted strings', () => {
    expect(isEncrypted('plain text')).toBe(false);
    expect(isEncrypted('sk-12345')).toBe(false);
    expect(isEncrypted('base64:base64:base64')).toBe(true);
  });
});
