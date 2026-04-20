import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db } from '@/lib/db';

// ─── Security: No hardcoded fallback for JWT_SECRET ───────────
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      'JWT_SECRET must be set in .env and be at least 32 characters. ' +
      'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
    );
  }
  return secret;
}

const SALT_ROUNDS = 12;

export interface UserPayload {
  id: string;
  email: string;
  username: string;
  name: string | null;
  role: string;
}

// ─── Validation ───────────────────────────────────────────────

export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || username.trim().length < 6) {
    return { valid: false, error: 'اسم المستخدم يجب أن يكون 6 أحرف على الأقل' };
  }
  if (username.length > 20) {
    return { valid: false, error: 'اسم المستخدم يجب ألا يتجاوز 20 حرفاً' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام فقط' };
  }
  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' };
  }
  if (password.length > 100) {
    return { valid: false, error: 'كلمة المرور طويلة جداً' };
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return { valid: false, error: 'كلمة المرور يجب أن تحتوي على أحرف وأرقام' };
  }
  return { valid: true };
}

// ─── Password Hashing ─────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT Token ────────────────────────────────────────────────

export function generateToken(payload: UserPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '15m' });
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign(
    { userId, type: 'refresh', jti: crypto.randomUUID() },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): UserPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (typeof decoded === 'object' && 'type' in decoded && (decoded as any).type === 'refresh') {
      return null;
    }
    return decoded as UserPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string; jti: string } | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any;
    if (decoded.type !== 'refresh') return null;
    return { userId: decoded.userId, jti: decoded.jti };
  } catch {
    return null;
  }
}

export function generateResetToken(email: string): string {
  return jwt.sign(
    { email, type: 'reset', jti: crypto.randomUUID() },
    getJwtSecret(),
    { expiresIn: '1h' }
  );
}

export function verifyResetToken(token: string): { email: string } | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as any;
    if (decoded.type !== 'reset') return null;
    return { email: decoded.email };
  } catch {
    return null;
  }
}

// ─── User Operations ──────────────────────────────────────────

export async function createUser(data: {
  email: string;
  username: string;
  password: string;
  name?: string;
}) {
  const hashedPassword = await hashPassword(data.password);

  return db.user.create({
    data: {
      email: data.email,
      username: data.username,
      password: hashedPassword,
      name: data.name || null,
    },
  });
}

export async function findUser(identifier: string) {
  return db.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { username: identifier },
      ],
    },
  });
}
