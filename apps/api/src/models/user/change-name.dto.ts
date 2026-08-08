import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class ChangeNameDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message:
      'username may contain only letters, numbers, dot, underscore and hyphen',
  })
  username: string;
}
