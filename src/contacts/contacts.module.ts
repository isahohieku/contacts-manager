import { Module } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from './entities/contact.entity';
import { Phone } from '../phones/entities/phone.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Email } from '../emails/entities/email.entity';
import { TagsService } from '../tags/tags.service';

@Module({
  imports: [TypeOrmModule.forFeature([Contact, Phone, Tag, Email])],
  controllers: [ContactsController],
  providers: [ContactsService, TagsService],
})
export class ContactsModule {}
