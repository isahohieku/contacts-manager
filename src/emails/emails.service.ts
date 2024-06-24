import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entity/user.entity';
import { CreateEmailDto } from './dto/create-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { Email } from './entities/email.entity';
import { EmailType } from '../email-types/entities/email-type.entity';
import { handleError } from '../utils/handlers/error.handler';
import { EmailErrorCodes } from '../utils/constants/emails/errors';
import { ContactsService } from '../contacts/contacts.service';
import { ERROR_MESSAGES } from '../utils/constants/generic/errors';

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
    const email = await this.emailRepository.findOne({
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
