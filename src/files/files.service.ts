import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { handleError } from '../utils/handlers/error.handler';
import { FilesErrorCodes } from '../utils/constants/files/errors';

@Injectable()
export class FilesService {
  constructor(private readonly configService: ConfigService) {}

  async uploadFile(file): Promise<{ path: string }> {
    if (!file) {
      const errors = {
        file: FilesErrorCodes.NO_FILE,
      };

      // TODO: Handle error message
      throw handleError(HttpStatus.UNPROCESSABLE_ENTITY, '', errors);
    }
    const path = {
      local: `/${this.configService.get('app.apiPrefix')}/v1/${file.path}`,
      s3: file.location,
    };

    return {
      path: path[this.configService.get('file.driver')],
    };
  }
}
