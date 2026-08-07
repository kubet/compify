import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StorybookStoryDto {
  @ApiProperty({ description: 'Named CSF export identifier' })
  exportName: string;

  @ApiProperty({ description: 'Story display name' })
  name: string;

  @ApiPropertyOptional({
    description: 'JSON-serializable static story args',
    type: 'object',
    additionalProperties: true,
  })
  args?: unknown;

  @ApiProperty({
    enum: [true],
    description: 'Must be true; nonportable stories are rejected',
  })
  portable: true;
}

export class StorybookProvenanceDto {
  @ApiProperty({ description: 'Portable package-relative CSF source path' })
  storyPath: string;

  @ApiPropertyOptional({ description: '7-64 character hexadecimal Git commit' })
  gitCommit?: string;

  @ApiPropertyOptional({
    description: 'Sanitized source Git remote host/path without credentials',
  })
  gitRemote?: string;
}

/** The Storybook CLI wire format. Validation is deliberately performed by
 * CliService so nested records and unknown keys are rejected consistently. */
export class PublishStoryDto {
  @ApiProperty({ enum: [1] })
  schemaVersion: 1;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  publishingName: string;

  @ApiProperty({ enum: ['public', 'private', 'unlisted'] })
  visibility: 'public' | 'private' | 'unlisted';

  @ApiProperty({ enum: ['tsx', 'jsx', 'ts', 'js'] })
  language: 'tsx' | 'jsx' | 'ts' | 'js';

  @ApiProperty()
  entry: string;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
  files: Record<string, string>;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
  dependencies: Record<string, string>;

  @ApiProperty({ type: () => [StorybookStoryDto], minItems: 1, maxItems: 100 })
  stories: StorybookStoryDto[];

  @ApiProperty({ type: () => StorybookProvenanceDto })
  provenance: StorybookProvenanceDto;

  @ApiProperty({
    description: 'SHA-256 of the canonical request without digest',
  })
  digest: string;
}
