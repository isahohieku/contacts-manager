import { IsEmail, Validate } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsExist } from '../../utils/validators/is-exists.validator';

export class AuthForgotPasswordDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @Transform(({ value }) => value.toLowerCase().trim())
  @Validate(IsExist, ['User'], {
    message:
      'Failed to initiate account forgot password. Please try again later or contact support for assistance.',
  })
  @IsEmail({}, { message: 'A valid email address required' })
  email: string;
}
