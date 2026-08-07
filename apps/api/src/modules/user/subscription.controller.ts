import { ApiBrowserOrBearerAuth } from '../../common/browser-auth.decorator';
import { ApiTags } from '@nestjs/swagger';
import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Headers,
  Query,
  RawBody,
} from '@nestjs/common';
import { UserService } from './user.service';
import { PaymentService } from './payment.service';
import { JwtUserGuard } from 'src/common/guards/jwt-user.guard';
import { GetUser } from 'src/common/get-user.decorator';
import { User } from 'src/entities/user/user.entity';
import { Request } from 'express';

@ApiTags('Subscriptions')
@Controller('subscription')
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: UserService,
    private readonly paymentService: PaymentService,
  ) {}

  @Get('plans')
  async getAllSubscriptions() {
    return await this.subscriptionService.getAllSubscriptions();
  }

  @ApiBrowserOrBearerAuth()
  @UseGuards(JwtUserGuard)
  @Get('user/plans')
  async getUserSubscriptions(
    @Query('show') show: string,
    @GetUser() user: User,
  ) {
    return await this.subscriptionService.getUserSubscriptions(user, show);
  }

  @Post('stripe-webhook')
  async handleStripeWebhook(
    @Req() req: Request,
    @RawBody() rawBody: Buffer,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentService.stripeWebhook(rawBody, signature);
  }

  @ApiBrowserOrBearerAuth()
  @UseGuards(JwtUserGuard)
  @Post('create-checkout-session')
  async createCheckoutSession(
    @Body() body: any,
    @GetUser() user: User,
    @Req() req: Request,
  ) {
    return await this.paymentService.createCheckoutSession(body, user, req);
  }

  @ApiBrowserOrBearerAuth()
  @UseGuards(JwtUserGuard)
  @Post('preview-upgrade')
  async previewUpgrade(@Body('planId') planId: string, @GetUser() user: User) {
    return await this.paymentService.previewUpgrade(planId, user);
  }

  @ApiBrowserOrBearerAuth()
  @UseGuards(JwtUserGuard)
  @Post('upgrade')
  async upgradeSubscription(
    @Body('planId') planId: string,
    @GetUser() user: User,
  ) {
    return await this.paymentService.performUpgrade(planId, user);
  }

  @ApiBrowserOrBearerAuth()
  @UseGuards(JwtUserGuard)
  @Post('cancel')
  async cancelSubscription(@GetUser() user: User) {
    return await this.paymentService.cancelSubscription(user);
  }
}
