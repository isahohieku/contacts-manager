import { Phone } from '@contactApp/modules/phones/entities/phone.entity';
import { EntityHelper } from '@contactApp/shared/entities/entity-helper';
import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';

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
