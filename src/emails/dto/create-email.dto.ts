import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, Validate } from 'class-validator';
import { Contact } from '../../contacts/entities/contact.entity';
import { EmailType } from '../../email-types/entities/email-type.entity';
import { IsUniqueToContact } from '../../utils/validators/is-unique-to-contact.validator';
import { Email } from '../entities/email.entity';
import { EmailErrorCodes } from '../../utils/constants/emails/errors';

export class CreateEmailDto {
  @ApiProperty({ example: 'isahohieku@gmail.com' })
  @IsEmail({}, { message: 'Email address is required' })
  @Validate(IsUniqueToContact, [Email], {
    message: EmailErrorCodes.ALREADY_EXISTS,
  })
  email_address: string;

  @ApiProperty({ type: EmailType, example: { id: 1 } })
  @IsOptional()
  email_type = { id: 1 };

  @ApiProperty({ example: { id: 1 } })
  @IsNotEmpty({ message: 'Contact id is required' })
  contact: Contact;
}
