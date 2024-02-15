import { EntityBase } from 'src/utils/entity-helper';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Contact } from 'src/contacts/entities/contact.entity';
import { PhoneType } from 'src/phone-types/entities/phone-type.entity';

@Entity()
export class Phone extends EntityBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, type: 'varchar', length: 20 })
  phone_number?: string | null;

  @Column({ nullable: true, type: 'varchar', length: 20 })
  phone_type?: PhoneType | null;

  @ManyToOne(() => Contact, (contact) => contact.phone_numbers)
  contact: Contact;
}