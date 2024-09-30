import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';

import { EntityHelper } from '../../../shared/entities/entity-helper';
import { Phone } from '../../phones/entities/phone.entity';

@Entity()
export class PhoneType extends EntityHelper {
  @ApiProperty({ example: 1 })
  @PrimaryColumn()
  id: number;

  @Allow()
  @ApiProperty({ example: 'Mobile' })
  @Column()
  name?: string;

  @OneToMany(() => Phone, (phone_number) => phone_number.phone_type)
  phone_numbers: Phone[];
}
