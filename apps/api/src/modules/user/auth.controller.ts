import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { GoogleOAuthGuard } from '../../common/guards/google-oauth.guard';
import { UserService } from './user.service';
import { Request, Response } from 'express';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: UserService) {}

  @Get('google')
  @UseGuards(GoogleOAuthGuard)
  async googleAuth() {
    // Google OAuth initiation endpoint
    // The guard will handle the redirect to Google
  }

  @Get('google/callback')
  @UseGuards(GoogleOAuthGuard)
  async googleAuthCallback(@Req() req, @Res() res) {
    // Handle the Google OAuth callback
    const token = await this.authService.googleLogin(req.user);
    if (token) {
      return res.redirect(
        `${process.env.FRONTEND_URL}/verify/google?token=${token.accessToken}`,
      );
    } else {
      return res.redirect(`${process.env.FRONTEND_URL}/login`);
    }
  }
}
