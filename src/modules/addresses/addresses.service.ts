import { User } from '../users/entity/user.entity';
import { HttpStatus, Injectable } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Address } from './entities/address.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AddressType } from '../address-types/entities/address-type.entity';
import { AddressErrorCodes } from '../../shared/utils/constants/addresses/errors';
import { handleError } from '../../shared/utils/handlers/error.handler';
import { ContactsService } from '../contacts/contacts.service';
import { ERROR_MESSAGES } from '../../shared/utils/constants/generic/errors';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    private readonly contactsService: ContactsService,
  ) {}

  async create(user: User, createAddressDto: CreateAddressDto) {
    await this.contactsService.findOne(user, createAddressDto.contact.id);

    const address = await this.addressRepository.save(
      this.addressRepository.create({
        ...createAddressDto,
      }),
    );
    return address;
  }

  async findOne(user: User, id: number) {
    const userId = user.id;

    const address = await this.addressRepository
      .createQueryBuilder('address')
      .leftJoinAndSelect('address.contact', 'contact')
      .leftJoinAndSelect('address.address_type', 'address_type')
      .leftJoinAndSelect('address.country', 'country')
      .where('address.id = :id', { id })
      .andWhere('contact.owner.id = :userId', { userId })
      .select(['address', 'contact.id', 'address_type', 'country'])
      .getOne();

    if (address) return address;

    const errors = {
      address: AddressErrorCodes.NOT_FOUND,
    };

    throw handleError(
      HttpStatus.NOT_FOUND,
      ERROR_MESSAGES.NOT_FOUND('Address', id),
      errors,
    );
  }

  async update(user: User, id: number, updateAddressDto: UpdateAddressDto) {
    await this.findOne(user, id);

    await this.addressRepository.save(
      this.addressRepository.create({
        id,
        ...updateAddressDto,
      }),
    );
    return this.findOne(user, id);
  }

  async remove(user: User, id: number) {
    const address = await this.findOne(user, id);
    await this.addressRepository.softDelete(id);
    return address;
  }

  async getAddressTypes() {
    const addressTypes = await AddressType.find();
    return addressTypes;
  }
}
