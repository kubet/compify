import { ApiTags, ApiSecurity } from '@nestjs/swagger';
import { Controller, Get, Query, Headers } from '@nestjs/common';
import { CliService } from './cli.service';

@ApiTags('CLI')
@ApiSecurity('cli-token')
@Controller('cli')
export class CliController {
  constructor(private readonly cliService: CliService) {}

  @Get('get')
  get(@Query('id') id: string, @Headers('x-cli-token') cliToken: string) {
    return this.cliService.get(id, cliToken);
  }

  @Get('get-all')
  getAll(@Headers('x-cli-token') cliToken: string) {
    return this.cliService.getAll(cliToken);
  }
}
