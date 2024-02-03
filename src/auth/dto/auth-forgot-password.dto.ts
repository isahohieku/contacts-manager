import { IsEmail } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AuthForgotPasswordDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @Transform(({ value }) => value.toLowerCase().trim())
  @IsEmail()
  email: string;
}
