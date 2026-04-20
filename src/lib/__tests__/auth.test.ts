import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock env before importing auth
process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long';

// Mock Prisma DB
vi.mock('@/lib/db', () => ({
  db: {
    user: {
      create: vi.fn().mockResolvedValue({
        id: '1',
        email: 'test@test.com',
        username: 'testuser',
        name: 'Test',
        role: 'user',
        password: 'hashed',
      }),
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
    },
    watchlist: {
      create: vi.fn().mockResolvedValue({ id: '1' }),
    },
  },
}));

import {
  validateUsername,
  validatePassword,
  generateToken,
  verifyToken,
  hashPassword,
  comparePassword,
} from '../auth';

describe('Auth - Validation', () => {
  describe('validateUsername', () => {
    it('should accept valid usernames', () => {
      expect(validateUsername('testuser').valid).toBe(true);
      expect(validateUsername('user_123').valid).toBe(true);
      expect(validateUsername('AbC123').valid).toBe(true);
    });

    it('should reject short usernames', () => {
      expect(validateUsername('abc').valid).toBe(false);
      expect(validateUsername('').valid).toBe(false);
    });

    it('should reject long usernames', () => {
      expect(validateUsername('a'.repeat(21)).valid).toBe(false);
    });

    it('should reject Arabic characters', () => {
      expect(validateUsername('مستخدم').valid).toBe(false);
    });

    it('should reject special characters', () => {
      expect(validateUsername('user@name').valid).toBe(false);
      expect(validateUsername('user name').valid).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should accept valid passwords', () => {
      expect(validatePassword('Password123').valid).toBe(true);
      expect(validatePassword('abc12345').valid).toBe(true);
    });

    it('should reject short passwords', () => {
      expect(validatePassword('Pass1').valid).toBe(false);
    });

    it('should reject passwords without numbers', () => {
      expect(validatePassword('Password').valid).toBe(false);
    });

    it('should reject passwords without letters', () => {
      expect(validatePassword('12345678').valid).toBe(false);
    });

    it('should reject very long passwords', () => {
      expect(validatePassword('a'.repeat(101)).valid).toBe(false);
    });
  });
});

describe('Auth - JWT', () => {
  it('should generate and verify tokens', () => {
    const payload = { id: '1', email: 'test@test.com', username: 'test', name: null, role: 'user' };
    const token = generateToken(payload);
    expect(token).toBeTruthy();

    const verified = verifyToken(token);
    expect(verified?.id).toBe(payload.id);
    expect(verified?.email).toBe(payload.email);
    expect(verified?.username).toBe(payload.username);
    expect(verified?.role).toBe(payload.role);
  });

  it('should reject invalid tokens', () => {
    expect(verifyToken('invalid-token')).toBeNull();
    expect(verifyToken('')).toBeNull();
  });
});

describe('Auth - Password Hashing', () => {
  it('should hash and compare passwords correctly', async () => {
    const hash = await hashPassword('Password123');
    expect(hash).toBeTruthy();
    expect(hash).not.toBe('Password123');

    const isValid = await comparePassword('Password123', hash);
    expect(isValid).toBe(true);

    const isInvalid = await comparePassword('WrongPassword', hash);
    expect(isInvalid).toBe(false);
  });
});
