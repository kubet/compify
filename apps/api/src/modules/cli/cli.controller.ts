import { ApiBearerAuth, ApiBody, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { Body, Controller, Get, Headers, Post, Query } from '@nestjs/common';
import { CliService } from './cli.service';
import { PublishStoryDto } from 'src/models/cli/publish-story.dto';

@ApiTags('CLI')
@Controller('cli')
export class CliController {
  constructor(private readonly cliService: CliService) {}

  @Post('publish-story')
  @ApiBearerAuth('cli-bearer')
  @ApiBody({ type: PublishStoryDto })
  publishStory(
    @Body() body: unknown,
    @Headers('authorization') authorization?: string,
  ) {
    return this.cliService.publishStory(body, authorization);
  }

  @Get('get')
  @ApiSecurity('cli-token')
  get(@Query('id') id: string, @Headers('x-cli-token') cliToken: string) {
    return this.cliService.get(id, cliToken);
  }

  @Get('get-all')
  @ApiSecurity('cli-token')
  getAll(@Headers('x-cli-token') cliToken: string) {
    return this.cliService.getAll(cliToken);
  }
}
