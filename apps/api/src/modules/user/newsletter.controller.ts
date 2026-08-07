import { ApiTags } from '@nestjs/swagger';
import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateNewsletterDto } from 'src/models/newsletter/create-newsletter.dto';

@ApiTags('Newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly newsletterService: UserService) {}

  @Post('subscribe')
  async subscribe(@Body() createNewsletterDto: CreateNewsletterDto) {
    return await this.newsletterService.subscribeToNewsletter(
      createNewsletterDto,
    );
  }
}
