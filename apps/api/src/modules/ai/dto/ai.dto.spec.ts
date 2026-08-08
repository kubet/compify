import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CompletionInputDto, RemapFilesDto } from './ai.dto';

describe('AI request DTO boundaries', () => {
  it('accepts the frontend remap payload using a component id', async () => {
    const dto = plainToInstance(RemapFilesDto, {
      componentId: 'abc_1234',
      files: { 'src/Button.tsx': 'export default 1' },
      uiFrameworks: ['tailwind'],
    });
    expect(await validate(dto)).toHaveLength(0);
  });

  it.each([
    { '/absolute.ts': 'x' },
    { '../secret.ts': 'x' },
    { 'src/__proto__/x.ts': 'x' },
    { 'src\\evil.ts': 'x' },
    { 'huge.ts': '😀'.repeat(50_001) },
  ])('rejects unsafe or UTF-8 oversized file maps', async (files) => {
    const dto = plainToInstance(RemapFilesDto, {
      componentId: 'abc_1234',
      files,
    });
    expect(await validate(dto)).not.toHaveLength(0);
  });

  it('keeps completion factor arrays compatible with the web client', async () => {
    const dto = plainToInstance(CompletionInputDto, {
      prompt: 'change hue',
      fa: ['hue'],
    });
    expect(await validate(dto)).toHaveLength(0);
  });
});
