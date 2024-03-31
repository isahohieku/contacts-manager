import { User } from '../users/entity/user.entity';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Address } from './entities/address.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Contact } from '../contacts/entities/contact.entity';
import { Repository } from 'typeorm';
import { AddressType } from '../address-types/entities/address-type.entity';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(Contact)
    private readonly contactsRepository: Repository<Contact>,
  ) {}

  async create(user: User, createAddressDto: CreateAddressDto) {
    const contact = await this.contactsRepository.findOne({
      where: { owner: { id: user.id }, id: createAddressDto.contact.id },
    });

    if (!contact) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          errors: {
            address: 'contactNotFound',
          },
        },
        HttpStatus.NOT_FOUND,
      );
    }

    const address = await this.addressRepository.save(
      this.addressRepository.create({
        ...createAddressDto,
      }),
    );
    return address;
  }

  async findOne(user: User, id: number) {
    const address = await this.addressRepository.findOne({
      where: {
        id,
        contact: {
          owner: {
            id: user.id,
          },
        },
      },
      loadEagerRelations: true,
    });

    if (address) return address;

    throw new HttpException(
      {
        status: HttpStatus.NOT_FOUND,
        errors: {
          address: 'notFound',
        },
      },
      HttpStatus.NOT_FOUND,
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
