import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { RuntimeLanguage } from 'src/entities/project/component.entity';
import { UpvoteStatus } from 'src/entities/project/upvote.entity';

export class ForkComponentDto {
  @IsString()
  @IsNotEmpty()
  componentId: string;
}

export class UpvoteComponentDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsEnum(UpvoteStatus)
  status: UpvoteStatus;
}

export class ReportComponentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  reason: string;
}

export class SearchComponentsDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  query?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1_000_000)
  page?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsEnum(RuntimeLanguage, { each: true })
  selectedOption?: RuntimeLanguage[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(100, { each: true })
  selectedTags?: string[];
}
