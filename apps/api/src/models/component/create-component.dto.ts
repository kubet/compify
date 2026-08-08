import {
  IsString,
  IsOptional,
  IsBoolean,
  IsObject,
  IsArray,
  IsEnum,
  MaxLength,
  Matches,
} from 'class-validator';
import {
  ComponentVisibility,
  RuntimeLanguage,
} from 'src/entities/project/component.entity';

export class CreateComponentDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  @MaxLength(255)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  activeFile?: string;

  @IsOptional()
  @IsString()
  previewFile?: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsBoolean()
  isShared?: boolean;

  @IsOptional()
  @IsObject()
  pageSettings?: any;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  usedUiFrameworks?: string[];

  @IsOptional()
  @IsObject()
  usedDeps?: any;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'publishingName must be a lowercase slug',
  })
  publishingName?: string;

  @IsOptional()
  @IsEnum(ComponentVisibility)
  visibility?: ComponentVisibility;

  @IsEnum(RuntimeLanguage)
  language: RuntimeLanguage;

  @IsOptional()
  @IsBoolean()
  isSetup?: boolean;
}
