import { User } from 'src/users/entity/user.entity';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreatePhoneDto } from './dto/create-phone.dto';
import { UpdatePhoneDto } from './dto/update-phone.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Phone } from './entities/phone.entity';
import { Repository } from 'typeorm';
import { Contact } from 'src/contacts/entities/contact.entity';

@Injectable()
export class PhonesService {
  constructor(
    @InjectRepository(Phone)
    private phoneRepository: Repository<Phone>,
    @InjectRepository(Contact)
    private contactsRepository: Repository<Contact>,
  ) {}
  async create(user: User, createPhoneDto: CreatePhoneDto) {
    const contact = await this.contactsRepository.findOne({
      where: { owner: user, id: createPhoneDto.contact.id },
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

  findAll() {
    return `This action returns all phones`;
  }

  findOne(id: number) {
    return `This action returns a #${id} phone`;
  }

  update(id: number, updatePhoneDto: UpdatePhoneDto) {
    return `This action updates a #${id} phone`;
  }

  remove(id: number) {
    return `This action removes a #${id} phone`;
  }
}
