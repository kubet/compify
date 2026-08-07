import { IsEmail, IsNotEmpty } from 'class-validator';

export class CreateNewsletterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
