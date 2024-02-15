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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { EmailsService } from './emails.service';
import { CreateEmailDto } from './dto/create-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Emails')
@Controller({
  path: 'emails',
  version: '1',
})
export class EmailsController {
  constructor(private readonly emailsService: EmailsService) {}

  @Post()
  create(@Request() request, @Body() createEmailDto: CreateEmailDto) {
    return this.emailsService.create(request.user, createEmailDto);
  }

  @Get()
  findAll() {
    return this.emailsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.emailsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateEmailDto: UpdateEmailDto) {
    return this.emailsService.update(+id, updateEmailDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.emailsService.remove(+id);
  }
}
