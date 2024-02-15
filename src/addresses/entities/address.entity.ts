import { Contact } from 'src/contacts/entities/contact.entity';
import { EntityBase } from 'src/utils/entity-helper';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column({ nullable: true, type: 'varchar', length: 50 })
  country?: string | null;

  @ManyToOne(() => Contact, (contact) => contact.addresses)
  contact: Contact;
}
