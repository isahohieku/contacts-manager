import { ApiProperty } from '@nestjs/swagger';
import { Validate, IsOptional } from 'class-validator';

import { IsExist } from '../../../common/decorators/is-exists.decorator';
import { AuthRegisterLoginDto } from '../../../modules/auth/dto/auth-register-login.dto';
import { ERROR_MESSAGES } from '../../../shared/utils/constants/generic/errors';
import { StatusEnum } from '../../../shared/utils/types/statuses.type';
import { Role } from '../../roles/entities/role.entity';
import { RoleEnum } from '../../roles/roles.enum';
import { Status } from '../../statuses/entities/status.entity';

export class CreateUserDto extends AuthRegisterLoginDto {
  @ApiProperty({ example: 'https://s3.....' })
  @IsOptional()
  avatar: string | null;

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
