import { ApiProperty } from '@nestjs/swagger';
import { PhoneType } from '../../phone-types/entities/phone-type.entity';
import { Contact } from '../../contacts/entities/contact.entity';

export class CreatePhoneDto {
  @ApiProperty({ example: '+2348036133002' })
  phone_number: string | null;

  @ApiProperty({ type: PhoneType, default: 1 })
  phone_type?: PhoneType | null;

  @ApiProperty({ example: 1 })
  contact: Contact;
}
