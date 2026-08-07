import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from 'src/modules/user/user.service';
import { User } from 'src/entities/user/user.entity';
import { JwtPayload } from './jwt-payload.interface';
import { extractAuthCookie } from './auth-cookie';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private userRepository: UserService,
    private configService: ConfigService,
  ) {
    super({
      secretOrKey: configService.get('JWT_SECRET'),
      // Browser sessions use the HttpOnly cookie; Bearer remains supported for
      // API clients and existing integrations.
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        extractAuthCookie,
      ]),
    });
  }
  async validate(payload: JwtPayload): Promise<User> {
    const { id } = payload;
    const user: User = await this.userRepository.getUserById(id);

    if (!user || payload.sessionVersion !== user.sessionVersion) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
