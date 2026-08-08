import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
  ValidateBy,
  ValidationOptions,
} from 'class-validator';

const SHORT_ID = /^[A-Za-z0-9_-]{4,64}$/;
const DATA_IMAGE = /^data:image\/(?:png|jpeg|gif|webp);base64,[A-Za-z0-9+/=]+$/;
const FRAMEWORKS = [
  'tailwind',
  'tailwind-ts',
  'tailwind-v4',
  'tailwind-ts-v4',
  'styled-components',
  'daisyui',
  'daisyui-ts',
  'mui',
  'shadcn',
  'theme',
];

function IsBoundedFiles(options?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isBoundedFiles',
      validator: {
        validate(value: unknown) {
          if (!value || typeof value !== 'object' || Array.isArray(value))
            return false;
          const entries = Object.entries(value as Record<string, unknown>);
          const reserved = new Set(['__proto__', 'prototype', 'constructor']);
          let totalBytes = 0;
          return (
            entries.length > 0 &&
            entries.length <= 30 &&
            entries.every(([name, content]) => {
              const segments = name.split('/');
              if (
                !name ||
                name.length > 240 ||
                name.startsWith('/') ||
                name.includes('\\') ||
                name.includes('\0') ||
                segments.some(
                  (part) =>
                    !part ||
                    part === '.' ||
                    part === '..' ||
                    reserved.has(part),
                ) ||
                typeof content !== 'string'
              )
                return false;
              const bytes = Buffer.byteLength(content, 'utf8');
              totalBytes += Buffer.byteLength(name, 'utf8') + bytes;
              return bytes <= 200_000 && totalBytes <= 500_000;
            })
          );
        },
        defaultMessage: () => 'files must contain 1-30 bounded text files',
      },
    },
    options,
  );
}

function IsBoundedJson(maxBytes: number, options?: ValidationOptions) {
  return ValidateBy(
    {
      name: 'isBoundedJson',
      constraints: [maxBytes],
      validator: {
        validate(value: unknown) {
          if (!value || typeof value !== 'object') return false;
          try {
            return Buffer.byteLength(JSON.stringify(value), 'utf8') <= maxBytes;
          } catch {
            return false;
          }
        },
        defaultMessage: () =>
          `value must be an object no larger than ${maxBytes} characters`,
      },
    },
    options,
  );
}

export class GenerateDto {
  @IsString() @MinLength(1) @MaxLength(20_000) prompt: string;
  @IsOptional() @IsString() @MaxLength(300_000) initialCode?: string;
  @IsOptional() @IsString() @MaxLength(40) language?: string;
  @IsOptional() @IsString() @Matches(SHORT_ID) id?: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsIn(FRAMEWORKS, { each: true })
  usedUiFrameworks?: string[];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(4)
  @IsString({ each: true })
  @MaxLength(2_500_000, { each: true })
  @Matches(DATA_IMAGE, { each: true })
  images?: string[];
  @IsOptional() @IsIn(['glm-text', 'glm-vision']) model?: string;
}

export class CompletionInputDto {
  @IsString() @MinLength(1) @MaxLength(4_000) prompt: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  fa?: string[];
}

class CursorPositionDto {
  @IsInt() @Min(1) @Max(1_000_000) lineNumber: number;
  @IsInt() @Min(1) @Max(1_000_000) column: number;
}
class EditorStateDto {
  @IsIn(['insert', 'complete', 'continue']) completionMode: string;
}
class RelatedFileDto {
  @IsString() @MinLength(1) @MaxLength(240) path: string;
  @IsString() @MaxLength(100_000) content: string;
}
class CompletionMetadataDto {
  @IsOptional() @IsString() @MaxLength(40) language?: string;
  @IsOptional() @IsString() @MaxLength(240) filename?: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  technologies?: string[];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => RelatedFileDto)
  relatedFiles?: RelatedFileDto[];
  @IsString() @MaxLength(100_000) textAfterCursor: string;
  @IsString() @MaxLength(100_000) textBeforeCursor: string;
  @ValidateNested()
  @Type(() => CursorPositionDto)
  cursorPosition: CursorPositionDto;
  @ValidateNested() @Type(() => EditorStateDto) editorState: EditorStateDto;
}
export class CompletionDto {
  @ValidateNested()
  @Type(() => CompletionMetadataDto)
  completionMetadata: CompletionMetadataDto;
}

export class GenerateTokensDto {
  @IsString() @MinLength(1) @MaxLength(8_000) prompt: string;
  @IsBoundedJson(150_000) currentTokens: Record<string, unknown> | unknown[];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsIn(FRAMEWORKS, { each: true })
  usedUiFrameworks?: string[];
  @IsOptional() @IsObject() @IsBoundedJson(100_000) ui?: Record<
    string,
    unknown
  >;
}

export class FilesDto {
  @IsObject() @IsBoundedFiles() files: Record<string, string>;
}
export class RemapFilesDto extends FilesDto {
  @IsString() @Matches(SHORT_ID) componentId: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsIn(FRAMEWORKS, { each: true })
  uiFrameworks?: string[];
}

export class ComponentNameDto {
  @IsString() @MinLength(1) @MaxLength(160) name: string;
  @IsString() @MinLength(1) @MaxLength(2_000) description: string;
  @IsOptional()
  @IsString()
  @MaxLength(2_500_000)
  @Matches(DATA_IMAGE)
  image?: string;
}
