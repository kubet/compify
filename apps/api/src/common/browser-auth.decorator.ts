import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth } from '@nestjs/swagger';

/** Document the two equivalent user-auth transports accepted by JwtStrategy. */
export function ApiBrowserOrBearerAuth() {
  return applyDecorators(
    ApiBearerAuth('bearer'),
    ApiCookieAuth('browser-cookie'),
  );
}
