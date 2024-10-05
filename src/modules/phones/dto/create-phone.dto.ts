import { IsUniqueToContact } from '@contactApp/common/decorators/is-unique-to-contact.decorator';
import { Contact } from '@contactApp/modules/contacts/entities/contact.entity';
import { PhoneType } from '@contactApp/modules/phone-types/entities/phone-type.entity';
import { ERROR_MESSAGES } from '@contactApp/shared/utils/constants/generic/errors';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, Validate } from 'class-validator';

import { Phone } from '../entities/phone.entity';

export class CreatePhoneDto {
  @ApiProperty({ example: '+2348036133002' })
  @IsNotEmpty({ message: 'Phone number is required' })
  @Validate(IsUniqueToContact, [Phone], {
    message: ERROR_MESSAGES.ALREADY_EXISTS_MAIN('Phone'),
  })
  phone_number: string;

  @ApiProperty({ type: PhoneType, example: { id: 1 } })
  @IsOptional()
  phone_type = { id: 1 };

  @ApiProperty({ example: { id: 1 } })
  @IsNotEmpty({ message: 'Contact id is required' })
  contact: Contact;
}
