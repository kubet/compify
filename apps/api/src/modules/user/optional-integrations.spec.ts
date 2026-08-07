import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { EmailService } from '../email/email.service';
import { GoogleStrategy } from '../../common/google.strategy';
import { GoogleOAuthGuard } from '../../common/guards/google-oauth.guard';

const emptyConfig = new ConfigService({ BACKEND_URL: 'http://localhost:3009' });

describe('optional integrations', () => {
  it('constructs Stripe billing while disabled and fails only when used', () => {
    const service = new PaymentService(
      emptyConfig,
      {} as any,
      {} as any,
      {} as any,
    );
    expect(() => (service as any).stripe).toThrow(ServiceUnavailableException);
  });

  it('constructs email while disabled and reports it unavailable when used', async () => {
    const service = new EmailService(emptyConfig);
    await expect(
      service.sendEmail('user@example.com', 'User', 'Hi', '<p>Hi</p>'),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('constructs the Google strategy while disabled and guards its routes', () => {
    expect(() => new GoogleStrategy(emptyConfig)).not.toThrow();
    const guard = new GoogleOAuthGuard(emptyConfig);
    expect(() => guard.canActivate({} as any)).toThrow(
      ServiceUnavailableException,
    );
  });
});
