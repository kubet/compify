import { NextFunction, Request, Response } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function originOf(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

/**
 * Cookies make browser requests implicit, so reject unsafe cross-origin browser
 * traffic. Requests with no browser metadata remain available to CLI/API
 * clients, whose explicit bearer/CLI tokens are not ambient credentials.
 */
export function createCsrfProtection(allowedUrls: Array<string | undefined>) {
  const allowedOrigins = new Set(allowedUrls.map(originOf).filter(Boolean));
  return (request: Request, response: Response, next: NextFunction) => {
    if (SAFE_METHODS.has(request.method.toUpperCase())) return next();

    const originHeader = request.get('origin');
    const fetchSite = request.get('sec-fetch-site');
    if (originHeader && !allowedOrigins.has(originOf(originHeader))) {
      return response
        .status(403)
        .json({ message: 'Cross-origin request rejected' });
    }
    if (!originHeader && fetchSite === 'cross-site') {
      return response
        .status(403)
        .json({ message: 'Cross-origin request rejected' });
    }
    return next();
  };
}
