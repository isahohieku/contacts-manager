import { IsEmail, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AuthEmailLoginDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @Transform(({ value }) => value.toLowerCase().trim())
  @IsEmail({}, { message: 'A valid email address required' })
  email: string;

  @ApiProperty()
  @MinLength(6, { message: 'A valid password is required' })
  password: string;
}
