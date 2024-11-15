import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FileEntity } from '../files/entities/file.entity';
import { User } from '../users/entity/user.entity';

import { FileStorageService } from './file-storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity, User])],
  providers: [FileStorageService],
  exports: [FileStorageService],
})
export class FileStorageModule {}
