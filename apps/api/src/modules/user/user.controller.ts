import { Body, Controller, Post, UseGuards, Get, Req } from '@nestjs/common';
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

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Post('/register')
  signUp(@Body() signUpDto: SignUpDto, @Req() req: Request): Promise<void> {
    return this.userService.signUp(signUpDto, req);
  }
  @Post('/token/send')
  sendToken(@Body('email') email: string) {
    return this.userService.sendRegisterToken(email);
  }

  @UseGuards(JwtUserGuard)
  @Post('/change-password')
  changePassword(@Body() b: ChangePasswordDto, @GetUser() user: User) {
    return this.userService.changePassword(b, user);
  }

  @UseGuards(JwtUserGuard)
  @Post('/change-name')
  changeName(@Body() b: ChangeNameDto, @GetUser() user: User) {
    return this.userService.changeName(b, user);
  }

  @UseGuards(JwtUserGuard)
  @Post('/change-email')
  changeSendEmail(@Body('email') email: string) {
    return this.userService.changeSendEmail(email);
  }

  @UseGuards(JwtUserGuard)
  @Post('/change-email/verify')
  changeVerifyEmail(
    @Body('token') token: string,
    @Body('email') email: string,
    @GetUser() user: User,
  ) {
    return this.userService.changeVerifyEmail(email, token, user);
  }

  @Post('verify/email')
  signContinueUp(@Body() b: VerifyAccountDto) {
    return this.userService.verifyEmail(b);
  }

  @Post('resend/register')
  resendRegisterEmail(@Body('email') email: string) {
    return this.userService.resendRegisterEmail(email);
  }

  @Post('resend/password')
  resendPasswordEmail(@Body('email') email: string) {
    return this.userService.resetPasswordUser(email);
  }
  @UseGuards(JwtUserGuard)
  @Post('delete/account')
  deleteAccount(@GetUser() user: User) {
    return this.userService.deleteAccount(user);
  }

  @Post('reset/password')
  resetPassword(
    @Body('token') token: string,
    @Body('password') password: string,
    @Body('email') email: string,
  ) {
    return this.userService.resetPassword(token, password, email);
  }

  @Post('/login')
  signIn(@Body() signInAuth: AuthCredentialsDto) {
    return this.userService.signIn(signInAuth);
  }

  @UseGuards(JwtUserGuard)
  @Post('/refresh')
  refreshToken(@GetUser() user: User) {
    return this.userService.refreshToken(user);
  }

  @Serialize(UserDto)
  @UseGuards(JwtUserGuard)
  @Get('/whoami')
  whoami(@GetUser() user: User) {
    return this.userService.whoami(user);
  }

  @UseGuards(JwtUserGuard)
  @Get('/subscription')
  getSubscription(@GetUser() user: User) {
    return this.userService.getSubscription(user);
  }

  @UseGuards(JwtUserGuard)
  @Post('/language/preference')
  setLanguagePreference(@Body() body: any, @GetUser() user: User) {
    return this.userService.setLanguagePreference(body, user);
  }

  @UseGuards(JwtUserGuard)
  @Post('/cli/token')
  generateCliToken(@GetUser() user: User) {
    return this.userService.generateCliToken(user);
  }

  @UseGuards(JwtUserGuard)
  @Post('/cli/token/revoke')
  revokeCliToken(@GetUser() user: User) {
    return this.userService.revokeCliToken(user);
  }

  @UseGuards(JwtUserGuard)
  @Get('/cli/token')
  getCliToken(@GetUser() user: User) {
    return this.userService.getCliToken(user);
  }
}
