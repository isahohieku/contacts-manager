import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { AuthRegisterLoginDto } from './auth-register-login.dto';

export class AuthUpdateDto extends PartialType(
  OmitType(AuthRegisterLoginDto, ['country', 'email']),
) {
  @ApiProperty()
  @IsOptional()
  oldPassword?: string;
}
