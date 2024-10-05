import { Address } from '@contactApp/modules/addresses/entities/address.entity';
import { EntityHelper } from '@contactApp/shared/entities/entity-helper';
import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';

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
