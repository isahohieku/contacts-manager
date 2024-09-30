import { Module } from '@nestjs/common';
import { FileStorageService } from './file-storage.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileEntity } from '../files/entities/file.entity';
import { User } from '../users/entity/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity, User])],
  providers: [FileStorageService],
  exports: [FileStorageService],
})
export class FileStorageModule {}
