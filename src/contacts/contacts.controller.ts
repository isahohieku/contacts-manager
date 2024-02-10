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
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { User } from 'src/users/entity/user.entity';

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
  findAll(@Request() request) {
    return this.contactsService.findAll(request.user as User);
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
