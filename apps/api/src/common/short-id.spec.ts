import { BadRequestException } from '@nestjs/common';
import { shortIdToUuid, uuidToShortId } from './short-id';

describe('short id parsing', () => {
  it('round trips a valid id', () => {
    const uuid = '11111111-1111-4111-8111-111111111111';
    expect(shortIdToUuid(uuidToShortId(uuid))).toBe(uuid);
  });

  it.each(['../../etc', 'bad id!', '\u0000'])(
    'turns malformed converter input into 400 (%p)',
    (id) => {
      expect(() => shortIdToUuid(id)).toThrow(BadRequestException);
    },
  );
});
