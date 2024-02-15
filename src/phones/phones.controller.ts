import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { PhonesService } from './phones.service';
import { CreatePhoneDto } from './dto/create-phone.dto';
import { UpdatePhoneDto } from './dto/update-phone.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Phones')
@Controller({
  path: 'phones',
  version: '1',
})
export class PhonesController {
  constructor(private readonly phonesService: PhonesService) {}

  @Post()
  create(@Request() request, @Body() createPhoneDto: CreatePhoneDto) {
    return this.phonesService.create(request.user, createPhoneDto);
  }

  @Get(':id')
  findOne(@Request() request, @Param('id') id: string) {
    return this.phonesService.findOne(request.user, +id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePhoneDto: UpdatePhoneDto) {
    return this.phonesService.update(+id, updatePhoneDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.phonesService.remove(+id);
  }
}
