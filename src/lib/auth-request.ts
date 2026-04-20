import { NextRequest } from 'next/server';
import { verifyToken, type UserPayload } from '@/lib/auth';

export const ACCESS_TOKEN_COOKIE = 'access_token';
export const REFRESH_TOKEN_COOKIE = 'refresh_token';

function readBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7).trim();
  return token || null;
}

export function getAccessTokenFromRequest(request: NextRequest): string | null {
  return readBearerToken(request) || request.cookies.get(ACCESS_TOKEN_COOKIE)?.value || null;
}

export function getRefreshTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get(REFRESH_TOKEN_COOKIE)?.value || null;
}

export function getUserFromRequest(request: NextRequest): UserPayload | null {
  const token = getAccessTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}
