import { Address } from 'src/addresses/entities/address.entity';
import { Email } from 'src/emails/entities/email.entity';
import { Phone } from 'src/phones/entities/phone.entity';
import { User } from 'src/users/entity/user.entity';
import { EntityBase } from 'src/utils/entity-helper';
import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

@Entity()
export class Contact extends EntityBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ nullable: false, type: 'varchar', length: 45 })
  firstName: string | null;

  @Index()
  @Column({ nullable: true, type: 'varchar', length: 45 })
  lastName?: string | null;

  @Column({ nullable: true, type: 'varchar', length: 100 })
  @Index()
  organization?: string | null;

  @Column({ nullable: true, type: 'varchar', length: 100 })
  @Index()
  job_title?: string | null;

  @Column({ nullable: true, type: 'date' })
  birthday?: Date;

  @Column({ nullable: true, type: 'date' })
  anniversary?: Date;

  @Column({ nullable: true, type: 'varchar', length: 100 })
  avatar?: string | null;

  @Column({ nullable: true, type: 'text' })
  notes?: string | null;

  @ManyToOne(() => User, (user) => user.contacts)
  owner: User;

  @OneToMany(() => Phone, (phone) => phone.contact, {
    cascade: true,
    eager: true,
  })
  phone_numbers: Phone[];

  @OneToMany(() => Email, (email) => email.contact, {
    cascade: true,
    eager: true,
  })
  emails: Email[];

  @OneToMany(() => Address, (address) => address.contact, {
    cascade: true,
    eager: true,
  })
  addresses: Address[];
}
