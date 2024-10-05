import { IsExist } from '@contactApp/common/decorators/is-exists.decorator';
import { AuthRegisterLoginDto } from '@contactApp/modules/auth/dto/auth-register-login.dto';
import { Role } from '@contactApp/modules/roles/entities/role.entity';
import { RoleEnum } from '@contactApp/modules/roles/roles.enum';
import { Status } from '@contactApp/modules/statuses/entities/status.entity';
import { ERROR_MESSAGES } from '@contactApp/shared/utils/constants/generic/errors';
import { StatusEnum } from '@contactApp/shared/utils/types/statuses.type';
import { ApiProperty } from '@nestjs/swagger';
import { Validate, IsOptional } from 'class-validator';

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
