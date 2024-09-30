import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CsvModule } from 'nest-csv-parser';

import { ContactsService } from '../contacts/contacts.service';
import { Contact } from '../contacts/entities/contact.entity';
import { FileStorageService } from '../file-storage/file-storage.service';
import { FileEntity } from '../files/entities/file.entity';
import { FilesService } from '../files/files.service';
import { Tag } from '../tags/entities/tag.entity';
import { TagsService } from '../tags/tags.service';

import { AddressesController } from './addresses.controller';
import { AddressesService } from './addresses.service';
import { Address } from './entities/address.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Address, Contact, Tag, FileEntity]),
    CsvModule,
  ],
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
