import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, Validate } from 'class-validator';
import { IsExist } from 'src/utils/validators/is-exists.validator';
import { PhoneType } from 'src/phone-types/entities/phone-type.entity';
import { Contact } from 'src/contacts/entities/contact.entity';

export class CreatePhoneDto {
  @ApiProperty({ example: '+2348036133002' })
  @IsOptional()
  phone_number: string | null;

  @ApiProperty({ type: PhoneType })
  @IsOptional()
  @Validate(IsExist, ['PhoneType', 'id'], {
    message: 'phoneTypeNotExists',
  })
  phone_type?: PhoneType;

  @ApiProperty({ example: 1 })
  @IsOptional()
  contact: Contact;
}
