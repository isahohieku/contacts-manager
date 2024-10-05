import { Contact } from '@contactApp/modules/contacts/entities/contact.entity';
import { User } from '@contactApp/modules/users/entity/user.entity';
import { EntityBase } from '@contactApp/shared/entities/entity-helper';
import { Allow } from 'class-validator';
import {
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

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
