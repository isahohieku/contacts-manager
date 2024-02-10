import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, Validate } from 'class-validator';
import { IsExist } from 'src/utils/validators/is-exists.validator';
import { PhoneType } from 'src/phone-types/entities/phone-type.entity';

export class CreatePhoneDto {
  @ApiProperty({ example: 'Doe' })
  @IsOptional()
  phone_number?: string | null;

  @ApiProperty({ type: PhoneType })
  @Validate(IsExist, ['PhoneType', 'id'], {
    message: 'phoneTypeNotExists',
  })
  phone_type?: PhoneType;
}
