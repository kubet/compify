import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, UseGuards, Req, Res } from '@nestjs/common';
import { GoogleOAuthGuard } from '../../common/guards/google-oauth.guard';
import { UserService } from './user.service';
import { setAuthCookie } from '../../common/auth-cookie';

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
      setAuthCookie(res, token.accessToken);
      // Never place bearer credentials in URLs (browser history, logs, referrers).
      return res.redirect(`${process.env.FRONTEND_URL}/verify/google`);
    } else {
      return res.redirect(`${process.env.FRONTEND_URL}/login`);
    }
  }
}
