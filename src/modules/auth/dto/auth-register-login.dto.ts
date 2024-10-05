import { IsNotExist } from '@contactApp/common/decorators/is-not-exists.decorator';
import { Country } from '@contactApp/modules/countries/entities/country.entity';
import { RoleEnum } from '@contactApp/modules/roles/roles.enum';
import { StatusEnum } from '@contactApp/modules/statuses/statuses.enum';
import { ERROR_MESSAGES } from '@contactApp/shared/utils/constants/generic/errors';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
  Validate,
} from 'class-validator';

import { AuthProvider } from '../entities/auth-providers.entity';

export class AuthRegisterLoginDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsNotEmpty({ message: ERROR_MESSAGES.REQUIRED('Email') })
  @Validate(IsNotExist, ['User'], {
    message: ERROR_MESSAGES.ALREADY_EXIST('User', 'email'),
  })
  @IsEmail()
  email: string;

  @ApiProperty()
  @MinLength(6, { message: ERROR_MESSAGES.REQUIRED('A valid password') })
  password: string;

  @ApiProperty({ example: 'John' })
  @IsNotEmpty({ message: ERROR_MESSAGES.REQUIRED('First name') })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty({ message: ERROR_MESSAGES.REQUIRED('Last name') })
  lastName: string;

  @ApiProperty({ type: AuthProvider, example: { id: 1 } })
  @IsNotEmpty({ message: ERROR_MESSAGES.REQUIRED('AuthProvider') })
  provider: AuthProvider;

  @ApiProperty({ type: Country, example: { id: 1 } })
  @IsNotEmpty({ message: ERROR_MESSAGES.REQUIRED('Country') })
  country: Country;

  @IsOptional()
  status? = { id: StatusEnum.inactive };

  @IsOptional()
  role? = { id: RoleEnum.user };
}
