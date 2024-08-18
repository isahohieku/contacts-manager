import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressesService } from './addresses.service';
import { AddressesController } from './addresses.controller';
import { Address } from './entities/address.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { Tag } from '../tags/entities/tag.entity';
import { ContactsService } from '../contacts/contacts.service';
import { TagsService } from '../tags/tags.service';
import { FilesService } from '../files/files.service';
import { FileStorageService } from '../file-storage/file-storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([Address, Contact, Tag])],
  controllers: [AddressesController],
  providers: [
    AddressesService,
    ContactsService,
    TagsService,
    FilesService,
    FileStorageService,
  ],
})
export class AddressesModule {}
