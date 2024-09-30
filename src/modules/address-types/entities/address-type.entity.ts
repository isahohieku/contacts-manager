import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';

import { EntityHelper } from '../../../shared/entities/entity-helper';
import { Address } from '../../addresses/entities/address.entity';

@Entity()
export class AddressType extends EntityHelper {
  @ApiProperty({ example: 1 })
  @PrimaryColumn()
  id: number;

  @Allow()
  @ApiProperty({ example: 'Home' })
  @Column()
  name?: string;

  @OneToMany(() => Address, (address) => address.address_type)
  addresses: Address[];
}
