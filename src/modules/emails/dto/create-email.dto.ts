import { IsUniqueToContact } from '@contactApp/common/decorators/is-unique-to-contact.decorator';
import { Contact } from '@contactApp/modules/contacts/entities/contact.entity';
import { EmailType } from '@contactApp/modules/email-types/entities/email-type.entity';
import { EmailErrorCodes } from '@contactApp/shared/utils/constants/emails/errors';
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, Validate } from 'class-validator';

import { Email } from '../entities/email.entity';

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
