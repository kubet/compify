import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { AppService } from './app.service';

@ApiTags('System')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/health')
  healthCheck() {
    return { status: 'ok' };
  }

  @Get('/source')
  sourceOffer() {
    const repositoryCandidate = process.env.SOURCE_REPOSITORY?.trim();
    const repository =
      repositoryCandidate && /^https:\/\//i.test(repositoryCandidate)
        ? repositoryCandidate.replace(/\/$/, '')
        : 'https://github.com/kubet/compify';
    const candidateRevision = process.env.SOURCE_REVISION?.trim();
    const revision =
      candidateRevision && /^[0-9a-f]{40}$/i.test(candidateRevision)
        ? candidateRevision
        : null;
    const candidateUrl = process.env.SOURCE_URL?.trim();
    const configuredUrl =
      candidateUrl && /^https:\/\//i.test(candidateUrl) ? candidateUrl : null;
    const source =
      configuredUrl ||
      (revision ? `${repository}/tree/${revision}` : repository);
    return {
      license: 'AGPL-3.0-only',
      source,
      revision,
    };
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
