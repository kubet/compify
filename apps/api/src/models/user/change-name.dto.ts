import { IsNotEmpty, IsString } from "class-validator";

export class ChangeNameDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;
}
