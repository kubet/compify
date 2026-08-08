import { ApiBrowserOrBearerAuth } from '../../common/browser-auth.decorator';
import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Post,
  Body,
  Res,
  UseGuards,
  HttpException,
} from '@nestjs/common';
import { AiService } from './ai.service';
import { Response } from 'express';
import { User } from 'src/entities/user/user.entity';
import { GetUser } from 'src/common/get-user.decorator';
import { JwtUserGuard } from 'src/common/guards/jwt-user.guard';
import { SubscriptionThrottlerGuard } from 'src/common/guards/subscription-throttler.guard';
import {
  ComponentNameDto,
  CompletionDto,
  CompletionInputDto,
  FilesDto,
  GenerateDto,
  GenerateTokensDto,
  RemapFilesDto,
} from './dto/ai.dto';

@ApiTags('AI')
@ApiBrowserOrBearerAuth()
@UseGuards(JwtUserGuard, SubscriptionThrottlerGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate')
  async generateResponse(
    @Body() body: GenerateDto,
    @Res() res: Response,
    @GetUser() user: User,
  ) {
    const abortController = new AbortController();
    const onClose = () => abortController.abort();
    res.once('close', onClose);
    if (res.destroyed || res.closed) abortController.abort();
    try {
      await this.aiService.getBestModel(
        body,
        res,
        user,
        abortController.signal,
      );
    } catch (error) {
      console.error('AI generation failed', error);
      if (res.destroyed || res.closed) return;
      if (!res.headersSent) {
        const status = error instanceof HttpException ? error.getStatus() : 500;
        res.status(status).json({
          error:
            status === 402 ? 'Insufficient AI credits' : 'AI generation failed',
        });
      } else if (!res.writableEnded) {
        res.write(
          `data: ${JSON.stringify({ error: 'AI generation failed' })}\n\n`,
        );
        res.end();
      }
    } finally {
      res.removeListener('close', onClose);
    }
  }

  @Post('completion')
  async completion(@Body() body: CompletionDto, @Res() res: Response) {
    return this.aiService.completion(body, res);
  }

  @Post('completion/input')
  async completionInput(@Body() body: CompletionInputDto) {
    return this.aiService.completionInput(body);
  }

  @Post('generate-tokens')
  async generateTokens(@Body() body: GenerateTokensDto, @GetUser() user: User) {
    return this.aiService.generateTokens(body, user);
  }

  @Post('remap-files')
  async remapFiles(@Body() body: RemapFilesDto, @GetUser() user: User) {
    return this.aiService.remapFiles(body, user);
  }

  @Post('generate-preview')
  async generatePreview(@Body() body: FilesDto, @GetUser() user: User) {
    return this.aiService.generatePreview(body, user);
  }

  @Post('component-name')
  async generateComponentName(@Body() body: ComponentNameDto) {
    return this.aiService.generateComponentName(body);
  }
}
