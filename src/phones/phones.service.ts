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
import { CountryCode } from 'libphonenumber-js';
import { validatePhoneNumber } from '../utils/validators/phone-number';

@Injectable()
export class PhonesService {
  constructor(
    @InjectRepository(Phone)
    private readonly phoneRepository: Repository<Phone>,
    private readonly contactsService: ContactsService,
  ) {}
  async create(
    user: User,
    createPhoneDto: CreatePhoneDto,
    validateNumber: boolean,
  ) {
    if (validateNumber) {
      if (
        !validatePhoneNumber(
          createPhoneDto.phone_number,
          user.country as unknown as CountryCode,
        )
      ) {
        const errors = {
          phone: PhoneNumberErrorCodes.INVALID,
        };

        throw handleError(
          HttpStatus.UNPROCESSABLE_ENTITY,
          ERROR_MESSAGES.INVALID('Phone Number'),
          errors,
        );
      }
    }

    await this.contactsService.findOne(user, createPhoneDto.contact.id);

    const phoneNumber = await this.phoneRepository.save(
      this.phoneRepository.create({
        ...createPhoneDto,
      }),
    );
    return phoneNumber;
  }

  async findOne(user: User, id: number) {
    const userId = user.id;

    const phoneNumber = await this.phoneRepository
      .createQueryBuilder('phone')
      .leftJoinAndSelect('phone.contact', 'contact')
      .leftJoinAndSelect('phone.phone_type', 'phone_type')
      .where('phone.id = :id', { id })
      .andWhere('contact.owner.id = :userId', { userId })
      .select(['phone', 'contact', 'phone_type'])
      .getOne();

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
