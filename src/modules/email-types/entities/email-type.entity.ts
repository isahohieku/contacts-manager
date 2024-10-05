import { Email } from '@contactApp/modules/emails/entities/email.entity';
import { EntityHelper } from '@contactApp/shared/entities/entity-helper';
import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';

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
