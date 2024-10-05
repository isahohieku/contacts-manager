import { Contact } from '@contactApp/modules/contacts/entities/contact.entity';
import { EmailType } from '@contactApp/modules/email-types/entities/email-type.entity';
import { EntityBase } from '@contactApp/shared/entities/entity-helper';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Email extends EntityBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, type: 'varchar', length: 100 })
  email_address?: string | null;

  @ManyToOne(() => EmailType, (emailType) => emailType.emails, { eager: true })
  email_type: EmailType;

  @ManyToOne(() => Contact, (contact) => contact.emails)
  contact: Contact;
}
