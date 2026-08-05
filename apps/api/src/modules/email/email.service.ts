import { Injectable } from '@nestjs/common';
import { SendMailClient } from 'zeptomail';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private client: SendMailClient;

  constructor(private configService: ConfigService) {
    const url = this.configService.get<string>('ZEPTOMAIL_API_URL');
    const token = this.configService.get<string>('ZEPTOMAIL_API_TOKEN');
    this.client = new SendMailClient({ url, token });
  }

  async sendEmail(
    to: string,
    name: string,
    subject: string,
    htmlBody: string,
  ): Promise<void> {
    try {
      await this.client.sendMail({
        from: {
          address: this.configService.get<string>('EMAIL_FROM_ADDRESS'),
          name: this.configService.get<string>('EMAIL_FROM_NAME'),
        },
        to: [
          {
            email_address: {
              address: to,
              name: name || to.split('@')[0],
            },
          },
        ],
        subject,
        htmlbody: htmlBody,
      });
    } catch (error) {
      console.error('Error sending email:', JSON.stringify(error));
      throw error;
    }
  }
}
