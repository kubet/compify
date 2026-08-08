import {
  IsArray,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class InsertThemeDto {
  @IsString()
  @MaxLength(64)
  @IsOptional()
  id?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @IsObject()
  @IsOptional()
  groups?: Record<string, unknown>;

  @IsArray()
  @IsOptional()
  factors?: unknown[];

  @IsArray()
  @IsOptional()
  values?: unknown[];

  @IsString()
  @MaxLength(64)
  @IsOptional()
  componentId?: string;
}
