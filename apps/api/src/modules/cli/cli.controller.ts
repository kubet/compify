import { Controller, Post, Body, Get, Query, Headers } from '@nestjs/common';
import { CliService } from './cli.service';
import { GetUser } from 'src/common/get-user.decorator';


@Controller('cli')
export class CliController {
  constructor(private readonly cliService: CliService) {}

  @Get('get')
  get(@Query('id') id: string,@Headers('x-cli-token') cliToken: string) {
    return this.cliService.get(id, cliToken);
  }

  @Get('get-all')
  getAll(@Headers('x-cli-token') cliToken: string) {
    return this.cliService.getAll(cliToken);
  }
}
