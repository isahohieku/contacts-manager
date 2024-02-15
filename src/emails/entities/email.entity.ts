import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { EntityBase } from 'src/utils/entity-helper';
import { Contact } from 'src/contacts/entities/contact.entity';
import { EmailType } from 'src/email-types/entities/email-type.entity';

@Entity()
export class Email extends EntityBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, type: 'varchar', length: 100 })
  email_address?: string | null;

  @Column({ nullable: true, type: 'varchar', length: 20 })
  email_type?: EmailType | null;

  @ManyToOne(() => Contact, (contact) => contact.emails)
  contact: Contact;
}
