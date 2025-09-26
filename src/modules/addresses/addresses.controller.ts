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

import { AddressType } from '../address-types/entities/address-type.entity';
import { User } from '../users/entity/user.entity';

import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Address } from './entities/address.entity';

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
  create(
    @Request() request: { user: User },
    @Body() createAddressDto: CreateAddressDto,
  ): Promise<Address> {
    return this.addressesService.create(request.user, createAddressDto);
  }

  @Get('address-types')
  getAddressTypes(): Promise<AddressType[]> {
    return this.addressesService.getAddressTypes();
  }

  @Get(':id')
  findOne(
    @Request() request: { user: User },
    @Param('id') id: string,
  ): Promise<Address> {
    return this.addressesService.findOne(request.user, +id);
  }

  @Patch(':id')
  update(
    @Request() request: { user: User },
    @Param('id') id: string,
    @Body() updateAddressDto: UpdateAddressDto,
  ): Promise<Address> {
    return this.addressesService.update(request.user, +id, updateAddressDto);
  }

  @Delete(':id')
  remove(
    @Request() request: { user: User },
    @Param('id') id: string,
  ): Promise<Address> {
    return this.addressesService.remove(request.user, +id);
  }
}
