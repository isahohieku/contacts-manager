import { ERROR_MESSAGES } from '../../../shared/utils/constants/generic/errors';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../roles/entities/role.entity';
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  Validate,
  IsOptional,
} from 'class-validator';
import { IsNotExist } from '../../../common/decorators/is-not-exists.decorator';
import { IsExist } from '../../../common/decorators/is-exists.decorator';
import { Status } from '../../statuses/entities/status.entity';
import { Country } from '../../countries/entities/country.entity';
import { RoleEnum } from '../../roles/roles.enum';
import { StatusEnum } from '../../../shared/utils/types/statuses.type';

export class CreateUserDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsNotEmpty()
  @Validate(IsNotExist, ['User'], {
    message: ERROR_MESSAGES.ALREADY_EXIST('User', 'email'),
  })
  @IsEmail()
  email: string | null;

  @ApiProperty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsNotEmpty()
  firstName: string | null;

  @ApiProperty({ example: 'Doe' })
  @IsNotEmpty()
  lastName: string | null;

  @ApiProperty({ example: 'https://s3.....' })
  @IsOptional()
  avatar: string | null;

  @ApiProperty({ example: { id: 1 } })
  @IsNotEmpty({ message: ERROR_MESSAGES.REQUIRED('Country') })
  country: Country;

  @ApiProperty({ type: Role })
  @Validate(IsExist, ['Role', 'id'], {
    message: ERROR_MESSAGES.NOT_FOUND_WITHOUT_ID('Role'),
  })
  role? = { id: RoleEnum.user };

  @ApiProperty({ type: Status })
  @Validate(IsExist, ['Status', 'id'], {
    message: ERROR_MESSAGES.NOT_FOUND_WITHOUT_ID('Status'),
  })
  status? = { id: StatusEnum.inactive };

  hash?: string | null;
}
