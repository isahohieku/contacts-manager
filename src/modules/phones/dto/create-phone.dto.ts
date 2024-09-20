import { ApiProperty } from '@nestjs/swagger';
import { PhoneType } from '../../phone-types/entities/phone-type.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { IsNotEmpty, IsOptional, Validate } from 'class-validator';
import { IsUniqueToContact } from '../../../common/decorators/is-unique-to-contact.decorator';
import { ERROR_MESSAGES } from '../../../shared/utils/constants/generic/errors';
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
