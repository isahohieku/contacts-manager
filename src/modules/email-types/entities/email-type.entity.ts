import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';

import { EntityHelper } from '../../../shared/entities/entity-helper';
import { Email } from '../../emails/entities/email.entity';

@Entity()
export class EmailType extends EntityHelper {
  @ApiProperty({ example: 1 })
  @PrimaryColumn()
  id: number;

  @Allow()
  @ApiProperty({ example: 'Work' })
  @Column()
  name?: string;

  @OneToMany(() => Email, (email) => email.email_type)
  emails: Email[];
}
