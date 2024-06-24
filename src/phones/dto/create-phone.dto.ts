import { ApiProperty } from '@nestjs/swagger';
import { PhoneType } from '../../phone-types/entities/phone-type.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePhoneDto {
  @ApiProperty({ example: '+2348036133002' })
  // TODO: Install lib phone number and create a decorator to validate phone numbers
  // TODO: Add user current country to user table so that user phone number without
  // country code can be validated based on user current country dial code
  @IsNotEmpty({ message: 'Phone number is required' })
  phone_number: string;

  @ApiProperty({ type: PhoneType, example: { id: 1 } })
  @IsOptional()
  phone_type = { id: 1 };

  @ApiProperty({ example: { id: 1 } })
  @IsNotEmpty({ message: 'Contact id is required' })
  contact: Contact;
}
