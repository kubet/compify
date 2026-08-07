import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { extractAuthCookie } from '../auth-cookie';

interface ThrottleRecord {
  count: number;
  expiresAt: number;
}
const userPlanMap: Readonly<Record<string, number>> = {
  Free: 50,
  Entrepreneur: 100,
  Visionary: 200,
};

/** Parse the Bearer scheme without a backtracking regular expression. */
export function extractBearerToken(authorization: unknown): string | null {
  if (typeof authorization !== 'string') return null;

  const prefix = 'Bearer ';
  if (authorization.slice(0, prefix.length).toLowerCase() !== 'bearer ') {
    return null;
  }

  const token = authorization.slice(prefix.length).trim();
  return token.length > 0 ? token : null;
}
@Injectable()
export class SubscriptionThrottlerGuard implements CanActivate {
  private static readonly stores = new Map<string, ThrottleRecord>();
  private static lastCleanup = Date.now();

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    // Cleanup expired records every hour
    this.cleanupIfNeeded();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const token =
      extractBearerToken(request.headers?.authorization) ||
      extractAuthCookie(request);

    if (!token) {
      throw new ThrottlerException();
    }

    if (!user || typeof user.id !== 'string' || user.id.length === 0) {
      throw new ThrottlerException();
    }

    let verifiedToken: unknown;
    try {
      verifiedToken = await this.jwtService.verifyAsync(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
    } catch {
      throw new ThrottlerException();
    }

    if (
      !verifiedToken ||
      typeof verifiedToken !== 'object' ||
      typeof (verifiedToken as { plan?: unknown }).plan !== 'string' ||
      (verifiedToken as { id?: unknown }).id !== user.id
    ) {
      throw new ThrottlerException();
    }

    const plan = (verifiedToken as { plan: string }).plan;
    const limit = userPlanMap[plan] ?? userPlanMap.Free;
    const now = Date.now();
    const key = `${user.id}:completion`;

    // Get or create record
    let record = SubscriptionThrottlerGuard.stores.get(key);
    if (!record || now >= record.expiresAt) {
      record = {
        count: 0,
        expiresAt: now + 24 * 60 * 60 * 1000, // 24 hours
      };
    }

    if (record.count >= limit) {
      throw new ThrottlerException(
        'Too many requests. Please try again later.',
      );
    }

    // Update record
    record.count++;
    SubscriptionThrottlerGuard.stores.set(key, record);

    return true;
  }

  private cleanupIfNeeded(): void {
    const now = Date.now();
    // Run cleanup once per hour
    if (now - SubscriptionThrottlerGuard.lastCleanup > 60 * 60 * 1000) {
      const stores = SubscriptionThrottlerGuard.stores;
      for (const [key, record] of stores.entries()) {
        if (now >= record.expiresAt) {
          stores.delete(key);
        }
      }
      SubscriptionThrottlerGuard.lastCleanup = now;
    }
  }
}
