import { EntityHelper } from '@contactApp/shared/entities/entity-helper';
import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { AuthProvidersEnum } from '../auth-providers.enum';

@Entity()
export class AuthProvider extends EntityHelper {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @Allow()
  @ApiProperty({ example: 'Facebook' })
  @Column()
  name: AuthProvidersEnum;

  @Allow()
  @ApiProperty({ example: true })
  @Column({ default: false })
  active: boolean;
}
