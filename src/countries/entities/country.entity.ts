import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Allow } from 'class-validator';
import { EntityHelper } from '../../utils/entity-helper';

@Entity()
export class Country extends EntityHelper {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @Allow()
  @ApiProperty({ example: 'NG' })
  @Column()
  code?: string;
}
