import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/users/entity/user.entity';
import { CreateEmailDto } from './dto/create-email.dto';
import { UpdateEmailDto } from './dto/update-email.dto';
import { Email } from './entities/email.entity';
import { Contact } from 'src/contacts/entities/contact.entity';

@Injectable()
export class EmailsService {
  constructor(
    @InjectRepository(Email)
    private readonly emailRepository: Repository<Email>,
    @InjectRepository(Contact)
    private readonly contactsRepository: Repository<Contact>,
  ) {}

  async create(user: User, createEmailDto: CreateEmailDto) {
    const contact = await this.contactsRepository.findOne({
      where: { owner: { id: user.id }, id: createEmailDto.contact.id },
    });

    if (!contact) {
      throw new HttpException(
        {
          status: HttpStatus.NOT_FOUND,
          errors: {
            email: 'emailNotFound',
          },
        },
        HttpStatus.NOT_FOUND,
      );
    }

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
    });

    if (email) return email;

    throw new HttpException(
      {
        status: HttpStatus.NOT_FOUND,
        errors: {
          email: 'notFound',
        },
      },
      HttpStatus.NOT_FOUND,
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
}
