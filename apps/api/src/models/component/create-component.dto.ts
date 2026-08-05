import {
  IsString,
  IsDate,
  IsOptional,
  IsBoolean,
  IsObject,
  IsArray,
} from 'class-validator';
import {
  ComponentVisibility,
  RuntimeLanguage,
} from 'src/entities/project/component.entity';

export class CreateComponentDto {
  @IsOptional()
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  activeFile: string;

  @IsOptional()
  @IsString()
  previewFile: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsBoolean()
  isShared: boolean;

  @IsOptional()
  @IsObject()
  pageSettings: any;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  usedUiFrameworks: string[];

  @IsOptional()
  @IsObject()
  usedDeps: any;

  @IsOptional()
  @IsString()
  publishingName: string;

  @IsOptional()
  @IsString()
  visibility: ComponentVisibility;

  @IsString()
  language: RuntimeLanguage;

  @IsOptional()
  @IsBoolean()
  isSetup: boolean;
}
