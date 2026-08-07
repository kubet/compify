import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    // passport-google-oauth20 validates its options in the constructor. Use
    // inert values so an intentionally disabled integration does not prevent boot.
    super({
      clientID:
        configService.get<string>('GOOGLE_CLIENT_ID') ||
        'google-oauth-disabled',
      clientSecret:
        configService.get<string>('GOOGLE_CLIENT_SECRET') ||
        'google-oauth-disabled',
      callbackURL: `${configService.get<string>('BACKEND_URL')}/auth/google/callback`,
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails, photos } = profile;
    const user = {
      email: emails[0].value,
      firstName: name.givenName,
      lastName: name.familyName,
      picture: photos[0].value,
      accessToken,
    };
    done(null, user);
  }
}
