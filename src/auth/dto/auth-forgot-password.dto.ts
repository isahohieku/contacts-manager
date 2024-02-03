import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';

export class AuthForgotPasswordDto {
  @Transform(({ value }) => value.toLowerCase().trim())
  @IsEmail()
  email: string;
}
