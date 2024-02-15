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
    private emailRepository: Repository<Email>,
    @InjectRepository(Contact)
    private contactsRepository: Repository<Contact>,
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

    const phoneNumber = await this.emailRepository.save(
      this.emailRepository.create({
        ...createEmailDto,
      }),
    );
    return phoneNumber;
  }

  findAll() {
    return `This action returns all emails`;
  }

  findOne(id: number) {
    return `This action returns a #${id} email`;
  }

  update(id: number, updateEmailDto: UpdateEmailDto) {
    return `This action updates a #${id} email`;
  }

  remove(id: number) {
    return `This action removes a #${id} email`;
  }
}
