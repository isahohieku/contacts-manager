import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressesService } from './addresses.service';
import { AddressesController } from './addresses.controller';
import { Address } from './entities/address.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { Tag } from '../tags/entities/tag.entity';
import { ContactsService } from '../contacts/contacts.service';
import { TagsService } from '../tags/tags.service';

@Module({
  imports: [TypeOrmModule.forFeature([Address, Contact, Tag])],
  controllers: [AddressesController],
  providers: [AddressesService, ContactsService, TagsService],
})
export class AddressesModule {}
