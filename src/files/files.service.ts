import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { handleError } from '../utils/handlers/error.handler';
import { FilesErrorCodes } from '../utils/constants/files/errors';
import { ERROR_MESSAGES } from '../utils/constants/generic/errors';
import { FileStorageService } from '../file-storage/file-storage.service';

@Injectable()
export class FilesService {
  constructor(
    private readonly configService: ConfigService,
    private readonly fileStorageService: FileStorageService,
  ) {}

  async uploadFile(file): Promise<{ path: string }> {
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

    return {
      path: path[this.configService.get('file.driver')],
    };
  }

  async removeFile(file: string) {
    await this.fileStorageService.removeFromStorage(file);
  }
}
