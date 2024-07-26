import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, Validate } from 'class-validator';
import { Contact } from '../../contacts/entities/contact.entity';
import { EmailType } from '../../email-types/entities/email-type.entity';
import { IsUniqueToContact } from '../../utils/validators/is-unique-to-contact.validator';
import { ERROR_MESSAGES } from '../../utils/constants/generic/errors';
import { Email } from '../entities/email.entity';

// TODO: Pass entities directly into the contraint array rather than the name of the entity
// Refactor the affected custom validator decorators
export class CreateEmailDto {
  @ApiProperty({ example: 'isahohieku@gmail.com' })
  @IsEmail({}, { message: 'Email address is required' })
  @Validate(IsUniqueToContact, [Email], {
    message: ERROR_MESSAGES.ALREADY_EXISTS_MAIN('Email'),
  })
  email_address: string;

  @ApiProperty({ type: EmailType, example: { id: 1 } })
  @IsOptional()
  email_type = { id: 1 };

  @ApiProperty({ example: { id: 1 } })
  @IsNotEmpty({ message: 'Contact id is required' })
  contact: Contact;
}
