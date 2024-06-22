import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { Contact } from '../../contacts/entities/contact.entity';
import { EmailType } from '../../email-types/entities/email-type.entity';

export class CreateEmailDto {
  @ApiProperty({ example: 'isahohieku@gmail.com' })
  @IsEmail({}, { message: 'Email address is required' })
  email_address: string;

  @ApiProperty({ type: EmailType, default: { id: 1 } })
  email_type?: EmailType;

  @ApiProperty({ example: { id: 1 } })
  @IsNotEmpty({ message: 'Contact id is required' })
  contact: Contact;
}
