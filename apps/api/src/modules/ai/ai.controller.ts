import { ApiBrowserOrBearerAuth } from '../../common/browser-auth.decorator';
import { ApiTags } from '@nestjs/swagger';
import { Controller, Post, Body, Res, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { Response } from 'express';
import { User } from 'src/entities/user/user.entity';
import { GetUser } from 'src/common/get-user.decorator';
import { JwtUserGuard } from 'src/common/guards/jwt-user.guard';
import { SubscriptionThrottlerGuard } from 'src/common/guards/subscription-throttler.guard';

@ApiTags('AI')
@ApiBrowserOrBearerAuth()
@UseGuards(JwtUserGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate')
  async generateResponse(
    @Body() b: any,
    @Res() res: Response,
    @GetUser() user: User,
  ) {
    try {
      await this.aiService.getBestModel(b, res, user);
    } catch (error) {
      console.error('Error in generateResponse:', error);
      res.status(500).json({ error: error.message });
    }
  }

  @UseGuards(SubscriptionThrottlerGuard)
  @Post('completion')
  async completion(@Body() b: any, @Res() res: Response) {
    return await this.aiService.completion(b, res);
  }

  @UseGuards(SubscriptionThrottlerGuard)
  @Post('completion/input')
  async completionInput(@Body() b: any) {
    return await this.aiService.completionInput(b);
  }

  @Post('generate-tokens')
  async generateTokens(@Body() b: any, @GetUser() user: User) {
    return await this.aiService.generateTokens(b, user);
  }

  @Post('remap-files')
  async remapFiles(@Body() b: any, @GetUser() user: User) {
    return await this.aiService.remapFiles(b, user);
  }

  @Post('generate-preview')
  async generatePreview(@Body() b: any, @GetUser() user: User) {
    return await this.aiService.generatePreview(b, user);
  }

  @UseGuards(SubscriptionThrottlerGuard)
  @Post('component-name')
  async generateComponentName(@Body() b: any) {
    return await this.aiService.generateComponentName(b);
  }
}
