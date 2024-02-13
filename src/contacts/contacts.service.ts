import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Contact } from './entities/contact.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entity/user.entity';
import { Phone } from 'src/phones/entities/phone.entity';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private contactsRepository: Repository<Contact>,
    @InjectRepository(Phone)
    private phoneRepository: Repository<Phone>,
  ) {}

  async create(user: User, createContactDto: CreateContactDto) {
    const contact = await this.contactsRepository.save(
      this.contactsRepository.create({
        ...createContactDto,
        owner: user,
      }),
    );
    return contact;
  }

  async findAll(user: User) {
    const contacts = await this.contactsRepository.find({
      where: {
        owner: {
          id: user.id,
        },
      },
    });
    return contacts;
  }

  async findOne(user: User, id: number) {
    const contact = await this.contactsRepository.findOne({
      where: {
        id,
        owner: {
          id: user.id,
        },
      },
    });

    if (contact) {
      return contact;
    }
    throw new HttpException(
      {
        status: HttpStatus.NOT_FOUND,
        errors: {
          contact: 'notFound',
        },
      },
      HttpStatus.NOT_FOUND,
    );
  }

  async update(user: User, id: number, updateContactDto: UpdateContactDto) {
    await this.findOne(user, id);

    const phoneNumbers = updateContactDto.phone_numbers;

    const newPhoneNumbers = phoneNumbers.filter(({ id }) => !id);

    const _phone_numbers = await this.phoneRepository.findBy({
      contact: { id },
    });

    phoneNumbers.forEach((phone) => {
      if (phone.id) {
        const found = _phone_numbers.findIndex(
          ({ id: phoneId }) => phoneId && phone.id === phoneId,
        );

        if (_phone_numbers[found]) {
          _phone_numbers[found] = {
            ..._phone_numbers[found],
            ...phone,
          } as Phone;
        }
      }
    });

    const phone_numbers = [..._phone_numbers, ...newPhoneNumbers];

    await this.contactsRepository.save(
      this.contactsRepository.create({
        id,
        ...updateContactDto,
        phone_numbers,
      }),
    );
    return this.findOne(user, id);
  }

  async remove(user: User, id: number) {
    const contact = await this.findOne(user, id);

    await this.contactsRepository.softDelete(id);

    return contact;
  }
}
