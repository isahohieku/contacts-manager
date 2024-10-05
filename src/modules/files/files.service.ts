import { FilesErrorCodes } from '@contactApp/shared/utils/constants/files/errors';
import { ERROR_MESSAGES } from '@contactApp/shared/utils/constants/generic/errors';
import { handleError } from '@contactApp/shared/utils/handlers/error.handler';
import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FileStorageService } from '../file-storage/file-storage.service';
import { User } from '../users/entity/user.entity';

import { FileEntity } from './entities/file.entity';

@Injectable()
export class FilesService {
  constructor(
    private readonly configService: ConfigService,
    private readonly fileStorageService: FileStorageService,
    @InjectRepository(FileEntity)
    private fileRepository: Repository<FileEntity>,
  ) {}

  async findOne(user: User, id: string) {
    const file = await this.fileRepository.findOne({
      where: {
        id,
        owner: {
          id: user.id,
        },
      },
    });

    if (file) {
      return file;
    }

    const errors = {
      file: FilesErrorCodes.NOT_FOUND,
    };

    throw handleError(
      HttpStatus.NOT_FOUND,
      ERROR_MESSAGES.NOT_FOUND('File', id),
      errors,
    );
  }

  async uploadFile(user: User, file): Promise<{ path: string }> {
    if (!file) {
      const errors = {
        file: FilesErrorCodes.NO_FILE,
      };

      throw handleError(
        HttpStatus.UNPROCESSABLE_ENTITY,
        ERROR_MESSAGES.NO_FILE,
        errors,
      );
    }
    const path = {
      local: `/${this.configService.get('app.apiPrefix')}/v1/${file.path}`,
      s3: file.location,
    };

    return this.fileRepository.save(
      this.fileRepository.create({
        owner: user,
        path: path[this.configService.get('file.driver')],
      }),
    );
  }

  async removeFile(user: User, id: string) {
    const file = await this.findOne(user, id);
    await this.fileStorageService.removeFromStorage(file.path);
    await this.fileRepository.softDelete(id);
    return file;
  }
}
