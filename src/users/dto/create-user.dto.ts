import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '../../roles/entities/role.entity';
import {
  IsEmail,
  IsNotEmpty,
  MinLength,
  Validate,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { IsNotExist } from '../../utils/validators/is-not-exists.validator';
import { IsExist } from '../../utils/validators/is-exists.validator';
import { Status } from '../../statuses/entities/status.entity';
import { Country } from '../../countries/entities/country.entity';

// TODO: Refactor error message for each required field

export class CreateUserDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsNotEmpty()
  @Validate(IsNotExist, ['User'], {
    // TODO: Refactor this status message
    message: 'User with email already exist',
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
  @IsNotEmpty({ message: 'Country is required' })
  @MaxLength(2)
  country: Country;

  @ApiProperty({ type: Role })
  @Validate(IsExist, ['Role', 'id'], {
    // TODO: Refactor this status message
    message: 'roleNotExists',
  })
  role?: Role | null;

  @ApiProperty({ type: Status })
  @Validate(IsExist, ['Status', 'id'], {
    // TODO: Refactor this status message
    message: 'statusNotExists',
  })
  status?: Status;

  hash?: string | null;
}
