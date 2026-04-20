import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '@/lib/db';

const JWT_SECRET = process.env.JWT_SECRET || 'portfolio-manager-secret-key-2024';

export interface UserPayload {
  id: string;
  email: string;
  username: string;
  name?: string | null;
  role: string;
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Compare password
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Verify JWT token
export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch {
    return null;
  }
}

// Validate username (at least 4 characters, alphanumeric and underscore)
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (username.length < 4) {
    return { valid: false, error: 'اسم المستخدم يجب أن يكون 4 أحرف على الأقل' };
  }
  if (username.length > 20) {
    return { valid: false, error: 'اسم المستخدم يجب أن لا يتجاوز 20 حرف' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: 'اسم المستخدم يجب أن يحتوي على أحرف إنجليزية وأرقام وشرطات سفلية فقط' };
  }
  return { valid: true };
}

// Validate password (at least 8 characters)
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' };
  }
  return { valid: true };
}

// Create user
export async function createUser(data: {
  email: string;
  username: string;
  password: string;
  name?: string;
}) {
  const hashedPassword = await hashPassword(data.password);
  
  const user = await db.user.create({
    data: {
      email: data.email,
      username: data.username,
      password: hashedPassword,
      name: data.name || data.username,
      role: 'user',
    },
  });
  
  return user;
}

// Find user by email or username
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

// Find user by ID
export async function findUserById(id: string) {
  return db.user.findUnique({
    where: { id },
  });
}
