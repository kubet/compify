import { ApiBrowserOrBearerAuth } from '../../common/browser-auth.decorator';
import { ApiTags } from '@nestjs/swagger';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ThemeService } from './theme.service';
import { JwtUserGuard } from 'src/common/guards/jwt-user.guard';
import { InsertThemeDto } from 'src/models/theme/insert-theme.dto';
import { GetUser } from 'src/common/get-user.decorator';
import { User } from 'src/entities/user/user.entity';

export function themeEtag(version: number): string {
  return `"theme-v${version}"`;
}

export function parseThemeIfMatch(value: string | undefined): number {
  if (value == null) {
    throw new HttpException(
      'If-Match is required. Reload the theme and try again.',
      HttpStatus.PRECONDITION_REQUIRED,
    );
  }
  const match = /^"theme-v([1-9]\d*)"$/.exec(value);
  if (!match) {
    throw new BadRequestException(
      'If-Match must be one strong theme ETag such as "theme-v1"',
    );
  }
  const version = Number(match[1]);
  if (!Number.isSafeInteger(version) || version > 2_147_483_647) {
    throw new BadRequestException('If-Match theme version is invalid');
  }
  return version;
}

function responseBody(theme: { version: number; [key: string]: unknown }) {
  const body = { ...theme };
  delete body.component;
  return body;
}

@ApiTags('Themes')
@ApiBrowserOrBearerAuth()
@Controller('theme')
@UseGuards(JwtUserGuard)
export class ThemeController {
  constructor(private readonly themeService: ThemeService) {}

  @Get(':id')
  async getTheme(
    @Param('id') id: string,
    @GetUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    const theme = await this.themeService.findOne(id, user);
    response.setHeader('ETag', themeEtag(theme.version));
    return responseBody(theme);
  }

  @Post('insert')
  async createOrUpdate(
    @Body() themeData: InsertThemeDto,
    @GetUser() user: User,
    @Headers('if-match') ifMatch: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const isUpdate = Boolean(themeData.id && themeData.id !== 'null');
    if (!isUpdate && ifMatch != null) {
      throw new BadRequestException('If-Match is only valid for theme updates');
    }
    const expectedVersion = isUpdate ? parseThemeIfMatch(ifMatch) : undefined;
    const theme = await this.themeService.createOrUpdate(
      themeData,
      user,
      expectedVersion,
    );
    response.setHeader('ETag', themeEtag(theme.version));
    return responseBody(theme);
  }

  @Delete(':id')
  async deleteTheme(
    @Param('id') id: string,
    @GetUser() user: User,
    @Headers('if-match') ifMatch: string | undefined,
  ) {
    return this.themeService.delete(id, user, parseThemeIfMatch(ifMatch));
  }
}
