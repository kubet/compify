import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class EmailDto {
  @IsEmail()
  email: string;
}

export class ChangeEmailVerifyDto extends EmailDto {
  @IsString()
  @IsNotEmpty()
  token: string;
}
