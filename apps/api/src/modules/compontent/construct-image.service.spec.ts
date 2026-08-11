import * as sharpNamespace from 'sharp';
import type sharpDefault from 'sharp';
import { ConstructImageService } from './construct-image.service';

const sharp =
  (sharpNamespace as unknown as { default?: typeof sharpDefault }).default ??
  (sharpNamespace as unknown as typeof sharpDefault);

describe('ConstructImageService animated WebP', () => {
  const service = new ConstructImageService({} as never);

  it('joins normalized frames into a looping animated WebP with Sharp', async () => {
    const frame = async (background: string) => {
      const buffer = await sharp({
        create: { width: 20, height: 10, channels: 4, background },
      })
        .png()
        .toBuffer();
      return `data:image/png;base64,${buffer.toString('base64')}`;
    };

    const result = await service.constructAnimatedImg([
      await frame('red'),
      await frame('blue'),
    ]);
    expect(result).toMatch(/^data:image\/webp;base64,/);

    const metadata = await sharp(
      Buffer.from(result.replace(/^data:image\/webp;base64,/, ''), 'base64'),
      { animated: true },
    ).metadata();
    expect(metadata).toEqual(
      expect.objectContaining({
        format: 'webp',
        pages: 2,
        pageHeight: 6,
        width: 12,
        loop: 0,
        delay: [600, 600],
      }),
    );
  });

  it('rejects empty input without producing a partial animation', async () => {
    await expect(service.constructAnimatedImg([])).rejects.toThrow(
      'No images provided',
    );
  });
});
