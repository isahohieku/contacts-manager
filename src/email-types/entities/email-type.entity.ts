import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Allow } from 'class-validator';
import { EntityHelper } from '../../utils/entity-helper';
import { Email } from 'src/emails/entities/email.entity';

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
