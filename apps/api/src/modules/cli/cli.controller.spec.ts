import { CliController } from './cli.controller';

describe('CliController publish-story', () => {
  it('passes only the Authorization header to the publishing service', async () => {
    const service = {
      publishStory: jest.fn().mockResolvedValue({ componentId: 'id' }),
    };
    const controller = new CliController(service as any);
    const body = { schemaVersion: 1 } as any;
    await expect(
      controller.publishStory(body, 'Bearer cli-token'),
    ).resolves.toEqual({ componentId: 'id' });
    expect(service.publishStory).toHaveBeenCalledWith(body, 'Bearer cli-token');
  });

  it('does not authenticate publishing through the legacy GET token header', async () => {
    const service = {
      publishStory: jest
        .fn()
        .mockRejectedValue(new Error('Bearer CLI token required')),
    };
    const controller = new CliController(service as any);
    await expect(controller.publishStory({} as any, undefined)).rejects.toThrow(
      'Bearer CLI token required',
    );
    expect(service.publishStory).toHaveBeenCalledWith({}, undefined);
  });
});
