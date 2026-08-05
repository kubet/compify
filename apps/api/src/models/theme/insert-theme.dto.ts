import { IsOptional } from 'class-validator';
import { IsString } from 'class-validator';

export class InsertThemeDto {
  @IsString()
  @IsOptional()
  id: string;

  @IsString()
  @IsOptional()
  name: string;

  @IsOptional()
  groups: any;

  @IsOptional()
  factors: any;

  @IsOptional()
  values: any;

  @IsOptional()
  componentId: string;
}
