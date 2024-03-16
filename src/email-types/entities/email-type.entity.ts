import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryColumn } from 'typeorm';
import { Allow } from 'class-validator';
import { EntityHelper } from '../../utils/entity-helper';

@Entity()
export class EmailType extends EntityHelper {
  @ApiProperty({ example: 1 })
  @PrimaryColumn()
  id: number;

  @Allow()
  @ApiProperty({ example: 'Work' })
  @Column()
  name?: string;
}
