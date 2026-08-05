import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from './user.service';
import { Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: UserService) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Google OAuth initiation endpoint
    // The guard will handle the redirect to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req, @Res() res) {
    // Handle the Google OAuth callback
    const token = await this.authService.googleLogin(req.user);
    if(token){
      return res.redirect(
        `${process.env.FRONTEND_URL}/verify/google?token=${token.accessToken}`,
      );
    }else{
      return res.redirect(`${process.env.FRONTEND_URL}/login`);
    }
  }
}
