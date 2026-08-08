import { describe, expect, test } from 'bun:test';
import { makeRemapFilesPayload } from './ai-payload';

describe('AI remap payload', () => {
  test('sends the component id and never sends client-trusted theme keys', () => {
    const payload = makeRemapFilesPayload({
      files: { 'Button.tsx': 'code' }, uiFrameworks: ['tailwind'], componentId: 'component-id', themeKeys: ['untrusted'],
    });
    expect(payload).toEqual({ files: { 'Button.tsx': 'code' }, uiFrameworks: ['tailwind'], componentId: 'component-id' });
    expect('themeKeys' in payload).toBe(false);
  });
});
