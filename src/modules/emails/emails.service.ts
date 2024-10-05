import { EmailErrorCodes } from '@contactApp/shared/utils/constants/emails/errors';
import { ERROR_MESSAGES } from '@contactApp/shared/utils/constants/generic/errors';
import { handleError } from '@contactApp/shared/utils/handlers/error.handler';
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ContactsService } from '../contacts/contacts.service';
import { EmailType } from '../email-types/entities/email-type.entity';
import { User } from '../users/entity/user.entity';

import { CreateEmailDto } from './dto/create-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { Email } from './entities/email.entity';

@Injectable()
export class EmailsService {
  constructor(
    @InjectRepository(Email)
    private readonly emailRepository: Repository<Email>,
    private readonly contactsService: ContactsService,
  ) {}

  async create(user: User, createEmailDto: CreateEmailDto) {
    await this.contactsService.findOne(user, createEmailDto.contact.id);

    const email = await this.emailRepository.save(
      this.emailRepository.create({
        ...createEmailDto,
      }),
    );
    return email;
  }

  async findOne(user: User, id: number) {
    const userId = user.id;

    const email = await this.emailRepository
      .createQueryBuilder('email')
      .leftJoinAndSelect('email.contact', 'contact')
      .leftJoinAndSelect('email.email_type', 'email_type')
      .where('email.id = :id', { id })
      .andWhere('contact.owner.id = :userId', { userId })
      .select(['email', 'contact.id', 'email_type'])
      .getOne();

    if (email) return email;

    const errors = {
      email: EmailErrorCodes.NOT_FOUND,
    };

    throw handleError(
      HttpStatus.NOT_FOUND,
      ERROR_MESSAGES.NOT_FOUND('Email', id),
      errors,
    );
  }

  async update(user: User, id: number, updateEmailDto: UpdateEmailDto) {
    await this.findOne(user, id);

    await this.emailRepository.save(
      this.emailRepository.create({
        id,
        ...updateEmailDto,
      }),
    );
    return this.findOne(user, id);
  }

  async remove(user: User, id: number) {
    const email = await this.findOne(user, id);
    await this.emailRepository.softDelete(id);
    return email;
  }

  async getEmailTypes() {
    const emailTypes = await EmailType.find();
    return emailTypes;
  }
}
