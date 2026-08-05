import { Injectable, ExecutionContext, CanActivate } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import { JwtService } from '@nestjs/jwt';

interface ThrottleRecord {
  count: number;
  expiresAt: number;
}
const userPlanMap = {
  Free: 50,
  Entrepreneur: 100,
  Visionary: 200,
};
@Injectable()
export class SubscriptionThrottlerGuard implements CanActivate {
  private static readonly stores = new Map<string, ThrottleRecord>();
  private static lastCleanup = Date.now();

  constructor(private readonly jwtService: JwtService) {
    // Cleanup expired records every hour
    this.cleanupIfNeeded();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new ThrottlerException();
    }

    const decodedToken = this.jwtService.decode(token) as {
      sub: string;
      plan: string;
    };

    if (!decodedToken?.plan) {
      throw new ThrottlerException();
    }

    if (!user) {
      throw new ThrottlerException();
    }
    const limit = userPlanMap?.[decodedToken?.plan] || 50;
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
