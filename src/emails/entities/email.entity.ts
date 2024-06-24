import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EntityBase } from '../../utils/entity-helper';
import { Contact } from '../../contacts/entities/contact.entity';
import { EmailType } from '../../email-types/entities/email-type.entity';

// TODO: Email should be unique to a contact
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
