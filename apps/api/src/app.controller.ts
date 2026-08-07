import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/health')
  healthCheck() {
    return { status: 'ok' };
  }

  @Get('/ready')
  async readinessCheck() {
    try {
      await this.appService.checkReadiness();
      return { status: 'ready' };
    } catch {
      throw new ServiceUnavailableException('Dependencies are not ready');
    }
  }
}
