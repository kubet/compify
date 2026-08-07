import { isSafeRegistryPath } from './registry-path';

describe('isSafeRegistryPath', () => {
  it.each(['button.tsx', 'parts/button.tsx', 'parts\\button.tsx'])(
    'accepts %s',
    (value) => expect(isSafeRegistryPath(value)).toBe(true),
  );

  it.each(['', '../secret', 'parts/../../secret', '/tmp/secret', 'C:\\secret', 'a\0b'])(
    'rejects %j',
    (value) => expect(isSafeRegistryPath(value)).toBe(false),
  );
});
