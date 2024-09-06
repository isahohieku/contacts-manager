import { Module } from '@nestjs/common';
import { FilesController } from './files.controller';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { FilesService } from './files.service';
import { fileFilter } from '../utils/file-filter';
import { FileStorageService } from '../file-storage/file-storage.service';
import { FileStorageModule } from '../file-storage/file-storage.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/entity/user.entity';
import { FileEntity } from './entities/file.entity';

@Module({
  imports: [
    ConfigModule,
    FileStorageModule,
    MulterModule.registerAsync({
      imports: [ConfigModule, FileStorageModule],
      inject: [ConfigService, FileStorageService],
      useFactory: async (
        configService: ConfigService,
        fileStorageService: FileStorageService,
      ) => ({
        fileFilter,
        storage: await fileStorageService.getStorage(),
        limits: {
          fileSize: parseInt(configService.get<string>('file.maxFileSize'), 10),
        },
      }),
    }),
    TypeOrmModule.forFeature([FileEntity, User]),
  ],
  controllers: [FilesController],
  providers: [FilesService, FileStorageService],
  exports: [FileStorageService],
})
export class FilesModule {}
