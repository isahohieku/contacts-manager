import { ApiProperty } from '@nestjs/swagger';
import { Contact } from '../../contacts/entities/contact.entity';
import { EmailType } from '../../email-types/entities/email-type.entity';

export class CreateEmailDto {
  @ApiProperty({ example: 'isahohieku@gmail.com' })
  email: string | null;

  @ApiProperty({ type: EmailType, default: 1 })
  email_type?: EmailType;

  @ApiProperty({ example: 1 })
  contact: Contact;
}
