import { Contact } from '@contactApp/modules/contacts/entities/contact.entity';
import { PhoneType } from '@contactApp/modules/phone-types/entities/phone-type.entity';
import { EntityBase } from '@contactApp/shared/entities/entity-helper';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Phone extends EntityBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, type: 'varchar', length: 20 })
  phone_number?: string | null;

  @ManyToOne(() => PhoneType, (phone) => phone.phone_numbers, { eager: true })
  phone_type?: PhoneType | null;

  @ManyToOne(() => Contact, (contact) => contact.phone_numbers)
  contact: Contact;
}
