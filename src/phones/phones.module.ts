import { Module } from '@nestjs/common';
import { PhonesService } from './phones.service';
import { PhonesController } from './phones.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from '../contacts/entities/contact.entity';
import { Phone } from './entities/phone.entity';
import { Tag } from '../tags/entities/tag.entity';
import { ContactsService } from '../contacts/contacts.service';
import { TagsService } from '../tags/tags.service';

@Module({
  imports: [TypeOrmModule.forFeature([Phone, Contact, Tag])],
  controllers: [PhonesController],
  providers: [PhonesService, ContactsService, TagsService],
})
export class PhonesModule {}
