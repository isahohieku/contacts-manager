import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional } from 'class-validator';
import { Contact } from '../../contacts/entities/contact.entity';
import { EmailType } from '../../email-types/entities/email-type.entity';

export class CreateEmailDto {
  @ApiProperty({ example: 'isahohieku@gmail.com' })
  @IsEmail({}, { message: 'Email address is required' })
  email_address: string;

  @ApiProperty({ type: EmailType, example: { id: 1 } })
  @IsOptional()
  email_type = { id: 1 };

  @ApiProperty({ example: { id: 1 } })
  @IsNotEmpty({ message: 'Contact id is required' })
  contact: Contact;
}
