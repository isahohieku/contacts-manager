import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { Contact } from '../../contacts/entities/contact.entity';
import { EmailType } from '../../email-types/entities/email-type.entity';

export class CreateEmailDto {
  @ApiProperty({ example: 'isahohieku@gmail.com' })
  @IsOptional()
  email: string | null;

  @ApiProperty({ type: EmailType })
  @IsOptional()
  email_type?: EmailType;

  @ApiProperty({ example: 1 })
  @IsOptional()
  contact: Contact;
}
