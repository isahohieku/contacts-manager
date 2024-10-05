import { fileFilter } from '@contactApp/shared/utils/file-filter';
import { SearchTypes } from '@contactApp/shared/utils/types/contacts.type';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Response,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Response as Res } from 'express';
import { memoryStorage } from 'multer';

import { User } from '../users/entity/user.entity';

import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Contacts')
@Controller({
  path: 'contacts',
  version: '1',
})
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  create(@Request() request, @Body() createContactDto: CreateContactDto) {
    return this.contactsService.create(request.user as User, createContactDto);
  }

  @Get()
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: String })
  @ApiQuery({ name: 'type', required: false, enum: SearchTypes })
  async findAll(
    @Request() request,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search: string,
    @Query('type') type: SearchTypes,
  ) {
    if (limit > 50) {
      limit = 50;
    }

    return await this.contactsService.findAllWithPagination(
      {
        page,
        limit,
      },
      search,
      type,
      request.user as User,
    );
  }

  @Get('export')
  @ApiQuery({ name: 'id', required: false, type: String })
  async exportContacts(
    @Request() request,
    @Response() res: Res,
    @Query('id') id?: string,
  ) {
    const csvContacts = await this.contactsService.exportContacts(
      request.user as User,
      +id,
    );

    res.header('Content-Type', 'text/csv');
    res.attachment('contacts.csv');
    res.send(csvContacts);
  }

  @Post('import')
  @ApiConsumes('multipart/form-data')
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
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter,
    }),
  )
  async importContacts(@Request() request, @UploadedFile() file) {
    return await this.contactsService.importContacts(
      request.user as User,
      file,
    );
  }

  @Get(':id')
  findOne(@Request() request, @Param('id') id: string) {
    return this.contactsService.findOne(request.user as User, +id);
  }

  @Patch(':id')
  update(
    @Request() request,
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto,
  ) {
    return this.contactsService.update(
      request.user as User,
      +id,
      updateContactDto,
    );
  }

  @Delete(':id')
  remove(@Request() request, @Param('id') id: string) {
    return this.contactsService.remove(request.user, +id);
  }
}
