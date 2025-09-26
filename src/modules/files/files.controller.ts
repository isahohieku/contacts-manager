import {
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Request,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { FileTypes } from '@contactApp/shared/utils/types/files.type';

import { FileStorageService } from '../file-storage/file-storage.service';
import { User } from '../users/entity/user.entity';

import { FileEntity } from './entities/file.entity';
import { FilesService } from './files.service';

import type { Response } from 'express';

@ApiTags('Files')
@Controller({
  path: 'files',
  version: '1',
})
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly fileStorageService: FileStorageService,
  ) {}

  @Get(':file')
  getFile(
    @Param('file') filepath: string,
    @Res() res: Response,
  ): Promise<Response> {
    return this.fileStorageService.getFile(filepath, res);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'type', required: false, enum: FileTypes })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Request() request: { user: User },
    @UploadedFile() file: Express.Multer.File,
  ): Promise<{ path: string }> {
    return this.filesService.uploadFile(request.user, file);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Delete('remove/:id')
  remove(
    @Request() request: { user: User },
    @Param('id') file: string,
  ): Promise<FileEntity> {
    return this.filesService.removeFile(request.user, file);
  }
}
