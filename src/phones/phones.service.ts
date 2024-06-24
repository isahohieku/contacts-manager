import { User } from '../users/entity/user.entity';
import { HttpStatus, Injectable } from '@nestjs/common';
import { CreatePhoneDto } from './dto/create-phone.dto';
import { UpdatePhoneDto } from './dto/update-phone.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Phone } from './entities/phone.entity';
import { Repository } from 'typeorm';
import { PhoneType } from '../phone-types/entities/phone-type.entity';
import { handleError } from '../utils/handlers/error.handler';
import { PhoneNumberErrorCodes } from '../utils/constants/phone-numbers/errors';
import { ContactsService } from '../contacts/contacts.service';
import { ERROR_MESSAGES } from '../utils/constants/generic/errors';

@Injectable()
export class PhonesService {
  constructor(
    @InjectRepository(Phone)
    private readonly phoneRepository: Repository<Phone>,
    private readonly contactsService: ContactsService,
  ) {}
  async create(user: User, createPhoneDto: CreatePhoneDto) {
    console.log({ createPhoneDto });
    await this.contactsService.findOne(user, createPhoneDto.contact.id);

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

    const errors = {
      phone: PhoneNumberErrorCodes.NOT_FOUND,
    };

    throw handleError(
      HttpStatus.NOT_FOUND,
      ERROR_MESSAGES.NOT_FOUND('Phone Number', id),
      errors,
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
