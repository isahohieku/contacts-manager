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
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import type { Response } from 'express';
import { FilesService } from './files.service';
import { FileTypes } from '../../shared/utils/types/files.type';
import { FileStorageService } from '../file-storage/file-storage.service';

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
  getFile(@Param('file') filepath: string, @Res() res: Response) {
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
  async uploadFile(@Request() request, @UploadedFile() file) {
    return this.filesService.uploadFile(request.user, file);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'))
  @Delete('remove/:id')
  remove(@Request() request, @Param('id') file: string) {
    return this.filesService.removeFile(request.user, file);
  }
}
