import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  MinLength,
  Validate,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotExist } from '../../../common/decorators/is-not-exists.decorator';
import { Country } from '../../countries/entities/country.entity';
import { StatusEnum } from '../../statuses/statuses.enum';
import { RoleEnum } from '../../roles/roles.enum';
import { AuthProvider } from '../entities/auth-providers.entity';
import { ERROR_MESSAGES } from '../../../shared/utils/constants/generic/errors';

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
