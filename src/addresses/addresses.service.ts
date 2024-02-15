import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { Address } from './entities/address.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Contact } from 'src/contacts/entities/contact.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AddressesService {
  constructor(
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
    @InjectRepository(Contact)
    private readonly contactsRepository: Repository<Contact>,
  ) {}

  async create(user, createAddressDto: CreateAddressDto) {
    const contact = await this.contactsRepository.findOne({
      where: { owner: { id: user.id }, id: createAddressDto.contact.id },
    });

    if (!contact) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          errors: {
            address: 'addressNotFound',
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

  findAll() {
    return `This action returns all addresses`;
  }

  findOne(id: number) {
    return `This action returns a #${id} address`;
  }

  update(id: number, updateAddressDto: UpdateAddressDto) {
    return `This action updates a #${id} address`;
  }

  remove(id: number) {
    return `This action removes a #${id} address`;
  }
}
