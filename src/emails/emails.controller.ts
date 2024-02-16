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

  @Get('email-types')
  getEmailTypes() {
    return this.emailsService.getEmailTypes();
  }

  @Get(':id')
  findOne(@Request() request, @Param('id') id: string) {
    return this.emailsService.findOne(request.user, +id);
  }

  @Patch(':id')
  update(
    @Request() request,
    @Param('id') id: string,
    @Body() updateEmailDto: UpdateEmailDto,
  ) {
    return this.emailsService.update(request.user, +id, updateEmailDto);
  }

  @Delete(':id')
  remove(@Request() request, @Param('id') id: string) {
    return this.emailsService.remove(request.user, +id);
  }
}
