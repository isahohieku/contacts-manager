import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  AfterLoad,
  AfterInsert,
  ManyToOne,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import { EntityBase } from '../../utils/entity-helper';
import appConfig from '../../configs/app.config';
import { User } from '../../users/entity/user.entity';

@Entity({ name: 'file' })
export class FileEntity extends EntityBase {
  @ApiProperty({ example: 'cbcfa8b8-3a25-4adb-a9c6-e325f0d0f3ae' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Allow()
  @Column()
  path: string;

  @Allow()
  @ManyToOne(() => User, (user) => user.files)
  owner: User;

  @AfterLoad()
  @AfterInsert()
  updatePath() {
    if (this.path.indexOf('/') === 0) {
      this.path = appConfig().backendDomain + this.path;
    }
  }
}
