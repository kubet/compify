import { ApiBrowserOrBearerAuth } from '../../common/browser-auth.decorator';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  Req,
  Res,
  HttpCode,
} from '@nestjs/common';
import { Serialize } from 'src/common/interceptors/serialize.interceptor';
import { AuthCredentialsDto } from '../../models/user/auth-credentials.dto';
import { UserDto } from '../../models/user/user.dto';
import { User } from '../../entities/user/user.entity';
import { JwtUserGuard } from '../../common/guards/jwt-user.guard';
import { UserService } from './user.service';
import { SignUpDto } from '../../models/user/signup.dto';
import { VerifyAccountDto } from 'src/models/user/verify-account.dto';
import { ChangePasswordDto } from 'src/models/user/change-password.dto';
import { GetUser } from 'src/common/get-user.decorator';
import { ChangeNameDto } from 'src/models/user/change-name.dto';
import { Response } from 'express';
import { clearAuthCookie, setAuthCookie } from 'src/common/auth-cookie';

@ApiTags('Users')
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('/register')
  signUp(@Body() signUpDto: SignUpDto, @Req() req: Request): Promise<void> {
    return this.userService.signUp(signUpDto, req);
  }
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('/token/send')
  sendToken(@Body('email') email: string) {
    return this.userService.sendRegisterToken(email);
  }

  @ApiBrowserOrBearerAuth()
  @UseGuards(JwtUserGuard)
  @Post('/change-password')
  changePassword(@Body() b: ChangePasswordDto, @GetUser() user: User) {
    return this.userService.changePassword(b, user);
  }

  @ApiBrowserOrBearerAuth()
  @UseGuards(JwtUserGuard)
  @Post('/change-name')
  changeName(@Body() b: ChangeNameDto, @GetUser() user: User) {
    return this.userService.changeName(b, user);
  }

  @ApiBrowserOrBearerAuth()
  @UseGuards(JwtUserGuard)
  @Post('/change-email')
  changeSendEmail(@Body('email') email: string) {
    return this.userService.changeSendEmail(email);
  }

  @ApiBrowserOrBearerAuth()
  @UseGuards(JwtUserGuard)
  @Post('/change-email/verify')
  changeVerifyEmail(
    @Body('token') token: string,
    @Body('email') email: string,
    @GetUser() user: User,
  ) {
    return this.userService.changeVerifyEmail(email, token, user);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('verify/email')
  signContinueUp(@Body() b: VerifyAccountDto) {
    return this.userService.verifyEmail(b);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('resend/register')
  resendRegisterEmail(@Body('email') email: string) {
    return this.userService.resendRegisterEmail(email);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('resend/password')
  resendPasswordEmail(@Body('email') email: string) {
    return this.userService.resetPasswordUser(email);
  }
  @ApiBrowserOrBearerAuth()
  @UseGuards(JwtUserGuard)
  @Post('delete/account')
  deleteAccount(@GetUser() user: User) {
    return this.userService.deleteAccount(user);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('reset/password')
  resetPassword(
    @Body('token') token: string,
    @Body('password') password: string,
    @Body('email') email: string,
  ) {
    return this.userService.resetPassword(token, password, email);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('/login')
  async signIn(
    @Body() signInAuth: AuthCredentialsDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.userService.signIn(signInAuth);
    setAuthCookie(response, result.accessToken);
    return { authenticated: true };
  }

  @Post('/logout')
  @HttpCode(204)
  logout(@Res({ passthrough: true }) response: Response) {
    clearAuthCookie(response);
  }

  @ApiBrowserOrBearerAuth()
  @UseGuards(JwtUserGuard)
  @Post('/refresh')
  async refreshToken(
    @GetUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.userService.refreshToken(user);
    setAuthCookie(response, result.accessToken);
    return { authenticated: true };
  }

  @Serialize(UserDto)
  @ApiBrowserOrBearerAuth()
  @UseGuards(JwtUserGuard)
  @Get('/whoami')
  whoami(@GetUser() user: User) {
    return this.userService.whoami(user);
  }

  @ApiBrowserOrBearerAuth()
  @UseGuards(JwtUserGuard)
  @Get('/subscription')
  getSubscription(@GetUser() user: User) {
    return this.userService.getSubscription(user);
  }

  @ApiBrowserOrBearerAuth()
  @UseGuards(JwtUserGuard)
  @Post('/language/preference')
  setLanguagePreference(@Body() body: any, @GetUser() user: User) {
    return this.userService.setLanguagePreference(body, user);
  }

  @ApiBrowserOrBearerAuth()
  @UseGuards(JwtUserGuard)
  @Post('/cli/token')
  generateCliToken(@GetUser() user: User) {
    return this.userService.generateCliToken(user);
  }

  @ApiBrowserOrBearerAuth()
  @UseGuards(JwtUserGuard)
  @Post('/cli/token/revoke')
  revokeCliToken(@GetUser() user: User) {
    return this.userService.revokeCliToken(user);
  }

  @ApiBrowserOrBearerAuth()
  @UseGuards(JwtUserGuard)
  @Get('/cli/token')
  getCliToken(@GetUser() user: User) {
    return this.userService.getCliToken(user);
  }
}
