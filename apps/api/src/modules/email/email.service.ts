import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { SendMailClient } from 'zeptomail';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly client?: SendMailClient;
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('ZEPTOMAIL_API_URL');
    const token = this.configService.get<string>('ZEPTOMAIL_API_TOKEN');
    if (url && token) {
      this.client = new SendMailClient({ url, token });
    } else {
      this.logger.warn('Transactional email is disabled (ZeptoMail is not configured)');
    }
  }

  isConfigured(): boolean {
    return Boolean(this.client);
  }

  async sendEmail(
    to: string,
    name: string,
    subject: string,
    htmlBody: string,
  ): Promise<void> {
    if (!this.client) {
      throw new ServiceUnavailableException('Transactional email is not configured');
    }
    try {
      await this.client.sendMail({
        from: {
          address: this.configService.getOrThrow<string>('EMAIL_FROM_ADDRESS'),
          name: this.configService.get<string>('EMAIL_FROM_NAME', 'Compify'),
        },
        to: [{
          email_address: {
            address: to,
            name: name || to.split('@')[0],
          },
        }],
        subject,
        htmlbody: htmlBody,
      });
    } catch (error) {
      this.logger.error(`Error sending email: ${JSON.stringify(error)}`);
      throw error;
    }
  }
}
