import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { EntityBase } from '../../../shared/entities/entity-helper';
import { AddressType } from '../../address-types/entities/address-type.entity';
import { Contact } from '../../contacts/entities/contact.entity';
import { Country } from '../../countries/entities/country.entity';

@Entity()
export class Address extends EntityBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, type: 'varchar', length: 100 })
  street?: string | null;

  @Column({ nullable: true, type: 'varchar', length: 50 })
  city?: string | null;

  @Column({ nullable: true, type: 'varchar', length: 50 })
  state?: string | null;

  @Column({ nullable: true, type: 'varchar', length: 20 })
  postal_code?: string | null;

  @ManyToOne(() => Country, {
    eager: true,
  })
  country?: Country | null;

  @ManyToOne(() => AddressType, (address) => address.addresses, { eager: true })
  address_type?: AddressType | null;

  @ManyToOne(() => Contact, (contact) => contact.addresses)
  contact: Contact;
}
