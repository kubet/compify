import {
  AUTH_COOKIE_NAME,
  authCookieOptions,
  extractAuthCookie,
} from './auth-cookie';

describe('browser auth cookie', () => {
  const backend = process.env.BACKEND_URL;
  const sameSite = process.env.AUTH_COOKIE_SAME_SITE;

  afterEach(() => {
    if (backend === undefined) delete process.env.BACKEND_URL;
    else process.env.BACKEND_URL = backend;
    if (sameSite === undefined) delete process.env.AUTH_COOKIE_SAME_SITE;
    else process.env.AUTH_COOKIE_SAME_SITE = sameSite;
  });

  it('extracts only the named cookie', () => {
    expect(
      extractAuthCookie({
        headers: { cookie: `other=x; ${AUTH_COOKIE_NAME}=jwt%2Evalue` },
      }),
    ).toBe('jwt.value');
    expect(extractAuthCookie({ headers: { cookie: 'other=x' } })).toBeNull();
  });

  it('defaults to a host-only HttpOnly Lax cookie and follows backend HTTPS', () => {
    process.env.BACKEND_URL = 'https://api.self-hosted.test';
    delete process.env.AUTH_COOKIE_SAME_SITE;
    expect(authCookieOptions()).toMatchObject({
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });
    expect(authCookieOptions()).not.toHaveProperty('domain');
  });
});
