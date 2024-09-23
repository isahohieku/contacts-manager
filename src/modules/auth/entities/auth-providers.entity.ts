import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Allow } from 'class-validator';
import { EntityHelper } from '../../../shared/entities/entity-helper';
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
