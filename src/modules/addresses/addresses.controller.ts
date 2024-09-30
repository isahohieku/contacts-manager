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

import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Addresses')
@Controller({
  path: 'contacts/addresses',
  version: '1',
})
export class AddressesController {
  constructor(private readonly addressesService: AddressesService) {}

  @Post()
  create(@Request() request, @Body() createAddressDto: CreateAddressDto) {
    return this.addressesService.create(request.user, createAddressDto);
  }

  @Get('address-types')
  getAddressTypes() {
    return this.addressesService.getAddressTypes();
  }

  @Get(':id')
  findOne(@Request() request, @Param('id') id: string) {
    return this.addressesService.findOne(request.user, +id);
  }

  @Patch(':id')
  update(
    @Request() request,
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ) {
    return this.addressesService.update(request.user, +id, updateAddressDto);
  }

  @Delete(':id')
  remove(@Request() request, @Param('id') id: string) {
    return this.addressesService.remove(request.user, +id);
  }
}
