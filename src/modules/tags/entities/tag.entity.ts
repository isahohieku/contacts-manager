import { Allow } from 'class-validator';
import {
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

import { EntityBase } from '../../../shared/entities/entity-helper';
import { Contact } from '../../contacts/entities/contact.entity';
import { User } from '../../users/entity/user.entity';

@Entity('tags')
@Unique(['owner', 'name'])
export class Tag extends EntityBase {
  @PrimaryGeneratedColumn()
  id: number;

  @Allow()
  @Column()
  name: string;

  @Allow()
  @ManyToOne(() => User, (user) => user.tags)
  owner: User;

  @ManyToMany(() => Contact, (contact) => contact.tags)
  contact: Contact;
}
