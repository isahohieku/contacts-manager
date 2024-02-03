import { Transform } from 'class-transformer';
import { Role } from '../../roles/entities/role.entity';
import { IsEmail, IsNotEmpty, MinLength, Validate } from 'class-validator';
import { IsNotExist } from '../../utils/validators/is-not-exists.validator';
import { IsExist } from '../../utils/validators/is-exists.validator';
import { Status } from 'src/statuses/entities/status.entity';

export class CreateUserDto {
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsNotEmpty()
  @Validate(IsNotExist, ['User'], {
    message: 'User with email already exist',
  })
  @IsEmail()
  email: string | null;

  @MinLength(6)
  password: string;

  @IsNotEmpty()
  firstName: string | null;

  @IsNotEmpty()
  lastName: string | null;

  @Validate(IsExist, ['Role', 'id'], {
    message: 'roleNotExists',
  })
  role?: Role | null;

  @Validate(IsExist, ['Status', 'id'], {
    message: 'statusNotExists',
  })
  status?: Status;

  hash?: string | null;
}
