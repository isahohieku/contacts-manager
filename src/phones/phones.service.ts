import { User } from '../users/entity/user.entity';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreatePhoneDto } from './dto/create-phone.dto';
import { UpdatePhoneDto } from './dto/update-phone.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Phone } from './entities/phone.entity';
import { Repository } from 'typeorm';
import { Contact } from '../contacts/entities/contact.entity';
import { PhoneType } from '../phone-types/entities/phone-type.entity';

@Injectable()
export class PhonesService {
  constructor(
    @InjectRepository(Phone)
    private readonly phoneRepository: Repository<Phone>,
    @InjectRepository(Contact)
    private readonly contactsRepository: Repository<Contact>,
  ) {}
  async create(user: User, createPhoneDto: CreatePhoneDto) {
    const contact = await this.contactsRepository.findOne({
      where: { owner: { id: user.id }, id: createPhoneDto.contact.id },
    });

    if (!contact) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          errors: {
            contact: 'contactNotFound',
          },
        },
        HttpStatus.NOT_FOUND,
      );
    }

    const phoneNumber = await this.phoneRepository.save(
      this.phoneRepository.create({
        ...createPhoneDto,
      }),
    );
    return phoneNumber;
  }

  async findOne(user: User, id: number) {
    const phoneNumber = await this.phoneRepository.findOne({
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

    if (phoneNumber) return phoneNumber;

    throw new HttpException(
      {
        status: HttpStatus.NOT_FOUND,
        errors: {
          phone: 'notFound',
        },
      },
      HttpStatus.NOT_FOUND,
    );
  }

  async update(user: User, id: number, updatePhoneDto: UpdatePhoneDto) {
    await this.findOne(user, id);

    await this.phoneRepository.update(id, {
      ...updatePhoneDto,
    });
    const phoneNumber = await this.findOne(user, id);
    return phoneNumber;
  }

  async remove(user: User, id: number) {
    const phoneNumber = await this.findOne(user, id);
    await this.phoneRepository.softDelete(id);
    return phoneNumber;
  }

  async getPhoneTypes() {
    const phoneTypes = await PhoneType.find();
    return phoneTypes;
  }
}
