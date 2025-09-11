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
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { EmailType } from '../email-types/entities/email-type.entity';
import { User } from '../users/entity/user.entity';

import { CreateEmailDto } from './dto/create-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { EmailsService } from './emails.service';
import { Email } from './entities/email.entity';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Emails')
@Controller({
  path: 'contacts/emails',
  version: '1',
})
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Post()
  create(
    @Request() request: { user: User },
    @Body() createEmailDto: CreateEmailDto,
  ): Promise<Email> {
    return this.emailsService.create(request.user, createEmailDto);
  }

  @Get('email-types')
  getEmailTypes(): Promise<EmailType[]> {
    return this.emailsService.getEmailTypes();
  }

  @Get(':id')
  findOne(
    @Request() request: { user: User },
    @Param('id') id: string,
  ): Promise<Email> {
    return this.emailsService.findOne(request.user, +id);
  }

  @Patch(':id')
  update(
    @Request() request: { user: User },
    @Param('id') id: string,
    @Body() updateEmailDto: UpdateEmailDto,
  ): Promise<Email> {
    return this.emailsService.update(request.user, +id, updateEmailDto);
  }

  @Delete(':id')
  remove(
    @Request() request: { user: User },
    @Param('id') id: string,
  ): Promise<Email> {
    return this.emailsService.remove(request.user, +id);
  }
}
