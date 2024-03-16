import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { PhoneType } from '../../phone-types/entities/phone-type.entity';
import { Contact } from '../../contacts/entities/contact.entity';

export class CreatePhoneDto {
  @ApiProperty({ example: '+2348036133002' })
  @IsOptional()
  phone_number: string | null;

  @ApiProperty({ type: PhoneType })
  @IsOptional()
  phone_type?: PhoneType;

  @ApiProperty({ example: 1 })
  @IsOptional()
  contact: Contact;
}
