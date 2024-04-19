import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class AuthResetPasswordDto {
  @ApiProperty()
  @MinLength(6, { message: 'A valid password is required' })
  password: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'Invalid reset password code provided' })
  hash: string;
}
