import { ApiBrowserOrBearerAuth } from '../../common/browser-auth.decorator';
import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Param,
  Delete,
} from '@nestjs/common';
import { Theme } from '../../entities/project/theme.entity';
import { ThemeService } from './theme.service';
import { JwtUserGuard } from 'src/common/guards/jwt-user.guard';
import { InsertThemeDto } from 'src/models/theme/insert-theme.dto';
import { GetUser } from 'src/common/get-user.decorator';
import { User } from 'src/entities/user/user.entity';

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
  ): Promise<Theme> {
    return this.themeService.findOne(id, user);
  }

  @Post('insert')
  async createOrUpdate(@Body() theme: InsertThemeDto, @GetUser() user: User) {
    return this.themeService.createOrUpdate(theme, user);
  }

  @Delete(':id')
  async deleteTheme(@Param('id') id: string, @GetUser() user: User) {
    return this.themeService.delete(id, user);
  }
}
