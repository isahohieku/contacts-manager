import { EntityBase } from 'src/utils/entity-helper';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { PhoneTypeEnum } from '../phone-type.enum';
import { Contact } from 'src/contacts/entities/contact.entity';

@Entity()
export class Phone extends EntityBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, type: 'varchar', length: 20 })
  phone_number?: string | null;

  @Column({ nullable: true, type: 'varchar', length: 20 })
  phone_type?: PhoneTypeEnum | null;

  @ManyToOne(() => Contact, (contact) => contact.phone_numbers)
  contact: Contact;
}
