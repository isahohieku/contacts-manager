import { IsEmail, IsOptional, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { AuthProvider } from '../entities/auth-providers.entity';

export class AuthEmailLoginDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @Transform(({ value }) => value.toLowerCase().trim())
  @IsEmail({}, { message: 'A valid email address required' })
  email: string;

  @ApiProperty()
  @MinLength(6, { message: 'A valid password is required' })
  password: string;

  @ApiProperty({ type: AuthProvider, example: { id: 1 } })
  @IsOptional()
  provider = { id: 1 };
}
