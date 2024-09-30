import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Delete,
  Request,
  UseGuards,
  DefaultValuePipe,
  ParseBoolPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CreatePhoneDto } from './dto/create-phone.dto';
import { UpdatePhoneDto } from './dto/update-phone.dto';
import { PhonesService } from './phones.service';

// TODO: Add nestJS devtool

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Phones')
@Controller({
  path: 'contacts/phones',
  version: '1',
})
export class PhonesController {
  constructor(private readonly phonesService: PhonesService) {}

  @Post()
  create(
    @Query('validatePhone', new DefaultValuePipe(false), ParseBoolPipe)
    validatePhone: boolean,
    @Body()
    createPhoneDto: CreatePhoneDto,
    @Request() request,
  ) {
    return this.phonesService.create(
      request.user,
      createPhoneDto,
      validatePhone, // Validate phone number if this value is true. Else, just save the number
    );
  }

  @Get('phone-types')
  getPhoneTypes() {
    return this.phonesService.getPhoneTypes();
  }

  @Patch(':id')
  update(
    @Request() request,
    @Param('id') id: string,
    @Body() updatePhoneDto: UpdatePhoneDto,
  ) {
    return this.phonesService.update(request.user, +id, updatePhoneDto);
  }

  @Delete(':id')
  remove(@Request() request, @Param('id') id: string) {
    return this.phonesService.remove(request.user, +id);
  }

  @Get(':id')
  findOne(@Request() request, @Param('id') id: string) {
    return this.phonesService.findOne(request.user, +id);
  }
}
