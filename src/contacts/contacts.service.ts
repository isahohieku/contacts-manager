import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Contact } from './entities/contact.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entity/user.entity';

@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private contactsRepository: Repository<Contact>,
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

    await this.contactsRepository.save(
      this.contactsRepository.create({
        id,
        ...updateContactDto,
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
