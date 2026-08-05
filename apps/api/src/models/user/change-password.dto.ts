import { IsString } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;
  @IsString()
  newPassword: string;
}
