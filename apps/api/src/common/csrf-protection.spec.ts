import { createCsrfProtection } from './csrf-protection';

function invoke(headers: Record<string, string> = {}, method = 'POST') {
  const request = {
    method,
    get: (name: string) => headers[name.toLowerCase()],
  } as any;
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as any;
  const next = jest.fn();
  createCsrfProtection([
    'https://web.example.test',
    'https://api.example.test',
  ])(request, response, next);
  return { response, next };
}

describe('CSRF origin protection', () => {
  it('allows the configured frontend origin', () => {
    expect(
      invoke({ origin: 'https://web.example.test' }).next,
    ).toHaveBeenCalled();
  });

  it('rejects an untrusted origin, including same-site sibling hosts', () => {
    const { response, next } = invoke({ origin: 'https://evil.example.test' });
    expect(response.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows non-browser API clients without Origin metadata', () => {
    expect(invoke().next).toHaveBeenCalled();
  });

  it('rejects explicitly cross-site browser requests without Origin', () => {
    expect(
      invoke({ 'sec-fetch-site': 'cross-site' }).response.status,
    ).toHaveBeenCalledWith(403);
  });

  it('does not block safe OAuth redirects', () => {
    expect(
      invoke({ origin: 'https://accounts.google.com' }, 'GET').next,
    ).toHaveBeenCalled();
  });
});
