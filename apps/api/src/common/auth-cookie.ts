import { Response } from 'express';

export const AUTH_COOKIE_NAME = 'compify_auth';
export const AUTH_COOKIE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

export type AuthSameSite = 'lax' | 'strict' | 'none';

export function authCookieOptions() {
  const sameSite = (
    process.env.AUTH_COOKIE_SAME_SITE || 'lax'
  ).toLowerCase() as AuthSameSite;
  const secure =
    new URL(process.env.BACKEND_URL || 'http://localhost').protocol ===
    'https:';
  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    maxAge: AUTH_COOKIE_MAX_AGE_MS,
  } as const;
}

export function setAuthCookie(response: Response, token: string): void {
  response.cookie(AUTH_COOKIE_NAME, token, authCookieOptions());
}

export function clearAuthCookie(response: Response): void {
  const { httpOnly, secure, sameSite, path } = authCookieOptions();
  response.clearCookie(AUTH_COOKIE_NAME, { httpOnly, secure, sameSite, path });
}

/** Parse one cookie without adding cookie-parser to the API dependency surface. */
export function extractAuthCookie(request: {
  headers?: { cookie?: string };
}): string | null {
  const cookieHeader = request.headers?.cookie;
  if (!cookieHeader) return null;
  for (const cookie of cookieHeader.split(';')) {
    const separator = cookie.indexOf('=');
    if (separator < 0) continue;
    if (cookie.slice(0, separator).trim() !== AUTH_COOKIE_NAME) continue;
    const value = cookie.slice(separator + 1).trim();
    try {
      return decodeURIComponent(value) || null;
    } catch {
      return null;
    }
  }
  return null;
}
