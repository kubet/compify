import { IsString } from "class-validator";

export class VerifyAccountDto {
    @IsString()
    email: string;

    @IsString()
    token: string;
}