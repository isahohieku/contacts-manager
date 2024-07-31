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
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { User } from '../users/entity/user.entity';
import { SearchTypes } from '../utils/types/contacts.type';

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
