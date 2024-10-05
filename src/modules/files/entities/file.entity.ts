import appConfig from '@contactApp/configs/app.config';
import { User } from '@contactApp/modules/users/entity/user.entity';
import { EntityBase } from '@contactApp/shared/entities/entity-helper';
import { ApiProperty } from '@nestjs/swagger';
import { Allow } from 'class-validator';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  AfterLoad,
  AfterInsert,
  ManyToOne,
} from 'typeorm';

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
