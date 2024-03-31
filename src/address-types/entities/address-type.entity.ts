import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, OneToMany, PrimaryColumn } from 'typeorm';
import { Allow } from 'class-validator';
import { EntityHelper } from '../../utils/entity-helper';
import { Address } from 'src/addresses/entities/address.entity';

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
